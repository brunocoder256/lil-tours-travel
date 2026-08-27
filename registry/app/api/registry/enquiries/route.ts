import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("role, is_active")
      .eq("user_id", userId)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedRoles = ["admin", "supervisor", "data_entrant"];
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    const { data: enquiries, count } = await supabase
      .from("enquiries")
      .select("id, client_id, service, destination, status, source, created_at, clients(full_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const formatted = (enquiries || []).map((eq: Record<string, unknown>) => {
      const client = eq.clients as { full_name: string } | null;
      return {
        id: eq.id,
        client_id: eq.client_id,
        client_name: client?.full_name || "Unknown",
        service: eq.service,
        destination: eq.destination,
        status: eq.status,
        source: eq.source,
        created_at: eq.created_at,
      };
    });

    return NextResponse.json({
      enquiries: formatted,
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("[api/registry/enquiries] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
