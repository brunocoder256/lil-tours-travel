import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    // Verify staff profile exists and is active
    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("role, is_active")
      .eq("user_id", userId)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check permission
    const allowedRoles = ["admin", "supervisor", "data_entrant"];
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const offset = (page - 1) * limit;

    const { data: clients, count } = await supabase
      .from("clients")
      .select("id, full_name, phone, email, district, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      clients: clients || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("[api/registry/clients] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
