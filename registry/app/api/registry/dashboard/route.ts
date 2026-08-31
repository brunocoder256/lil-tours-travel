import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions"
import { requireApiAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "registry.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createServerClient();

    const [clientsResult, enquiriesResult, newTodayResult, openResult, completedResult, recentResult] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("enquiries").select("id", { count: "exact", head: true }),
      supabase.from("enquiries").select("id", { count: "exact", head: true }).gte("created_at", new Date().toISOString().split("T")[0]),
      supabase.from("enquiries").select("id", { count: "exact", head: true }).in("status", ["new", "contacted", "in_progress"]),
      supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("enquiries").select("id, service, status, source, created_at, clients(full_name)").order("created_at", { ascending: false }).limit(5),
    ]);

    const recent = (recentResult.data || []).map((eq: Record<string, unknown>) => {
      const client = eq.clients as { full_name: string } | null;
      return {
        id: eq.id,
        service: eq.service,
        status: eq.status,
        source: eq.source,
        client_name: client?.full_name || "Unknown",
        created_at: eq.created_at,
      };
    });

    return NextResponse.json({
      stats: {
        totalClients: clientsResult.count || 0,
        totalEnquiries: enquiriesResult.count || 0,
        newToday: newTodayResult.count || 0,
        openEnquiries: openResult.count || 0,
        completedEnquiries: completedResult.count || 0,
      },
      recent,
    });
  } catch (err) {
    console.error("[api/registry/dashboard] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
