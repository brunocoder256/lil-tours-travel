import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions"
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "field_leads.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerClient();

  // Get staff profile for ownership filter
  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Staff profile not found" }, { status: 400 });
  }

  const canViewAll = hasPermission(userRole, "field_leads.view_all");
  const ownerFilter = canViewAll ? {} : { created_by: profile.id };

  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  // Run all stats queries in parallel
  const [totalResult, newResult, followUpsTodayResult, overdueResult, convertedResult] = await Promise.all([
    supabase.from("field_leads").select("id", { count: "exact", head: true }).match(ownerFilter),
    supabase.from("field_leads").select("id", { count: "exact", head: true }).match({ ...ownerFilter, status: "new" }),
    supabase.from("follow_ups").select("id", { count: "exact", head: true })
      .eq("assigned_to", profile.id)
      .eq("status", "pending")
      .gte("due_at", today + "T00:00:00Z")
      .lte("due_at", today + "T23:59:59Z"),
    supabase.from("follow_ups").select("id", { count: "exact", head: true })
      .eq("assigned_to", profile.id)
      .eq("status", "pending")
      .lt("due_at", now),
    supabase.from("field_leads").select("id", { count: "exact", head: true }).match({ ...ownerFilter, status: "converted" }),
  ]);

  // Recent leads
  const { data: recentLeads } = await supabase
    .from("field_leads")
    .select("id, full_name, service_interest, status, source, created_at, next_follow_up_at")
    .match(ownerFilter)
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    stats: {
      totalLeads: totalResult.count || 0,
      newLeads: newResult.count || 0,
      followUpsToday: followUpsTodayResult.count || 0,
      overdueFollowUps: overdueResult.count || 0,
      converted: convertedResult.count || 0,
    },
    recentLeads: recentLeads || [],
  });
}
