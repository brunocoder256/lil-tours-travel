import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions"
import { requireApiAuth } from "@/lib/auth";
import { validateFollowUp } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "followups.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") || "";
  const view = searchParams.get("view") || ""; // "today", "upcoming", "overdue", "mine"
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "25", 10), 100);
  const offset = (page - 1) * limit;

  // Get staff profile
  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Staff profile not found" }, { status: 400 });
  }

  let query = supabase
    .from("follow_ups")
    .select(`
      id, field_lead_id, assigned_to, due_at, status, notes, outcome, created_at,
      lead:field_leads(full_name, phone, service_interest, status),
      assignee:staff_profiles!follow_ups_assigned_to_fkey(full_name)
    `, { count: "exact" });

  // Filter by view
  const now = new Date().toISOString();
  const todayStart = new Date().toISOString().split("T")[0] + "T00:00:00Z";
  const todayEnd = new Date().toISOString().split("T")[0] + "T23:59:59Z";

  if (view === "today") {
    query = query.gte("due_at", todayStart).lte("due_at", todayEnd);
  } else if (view === "upcoming") {
    query = query.gt("due_at", todayEnd);
  } else if (view === "overdue") {
    query = query.lt("due_at", now);
  } else if (view === "mine") {
    query = query.eq("assigned_to", profile.id);
  }

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query
    .order("due_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[api/registry/follow-ups] Error:", error);
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  }

  const followUps = (data || []).map((fu: Record<string, unknown>) => {
    const lead = fu.lead as { full_name: string; phone: string; service_interest: string; status: string } | null;
    const assignee = fu.assignee as { full_name: string } | null;
    return {
      id: fu.id,
      field_lead_id: fu.field_lead_id,
      assigned_to: fu.assigned_to,
      assigned_to_name: assignee?.full_name || "Unknown",
      due_at: fu.due_at,
      status: fu.status,
      notes: fu.notes,
      outcome: fu.outcome,
      created_at: fu.created_at,
      lead_name: lead?.full_name || "Unknown",
      lead_phone: lead?.phone || null,
      lead_service: lead?.service_interest || null,
      lead_status: lead?.status || null,
    };
  });

  return NextResponse.json({
    followUps,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "followups.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateFollowUp(body);
  if (!validation.ok) {
    return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
  }

  const supabase = createServerClient();

  // Get staff profile
  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Staff profile not found" }, { status: 400 });
  }

  // Verify lead exists
  const { data: lead } = await supabase
    .from("field_leads")
    .select("id")
    .eq("id", validation.data!.fieldLeadId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Field lead not found" }, { status: 404 });
  }

  const { data: followUp, error } = await supabase
    .from("follow_ups")
    .insert({
      field_lead_id: validation.data!.fieldLeadId,
      assigned_to: profile.id,
      due_at: validation.data!.dueAt,
      notes: validation.data!.notes,
      status: "pending",
      created_by: profile.id,
    })
    .select("id, field_lead_id, due_at, status, created_at")
    .single();

  if (error) {
    console.error("[api/registry/follow-ups] Create error:", error);
    return NextResponse.json({ error: "Failed to create follow-up" }, { status: 500 });
  }

  // Also update lead's next_follow_up_at
  await supabase
    .from("field_leads")
    .update({ next_follow_up_at: validation.data!.dueAt })
    .eq("id", validation.data!.fieldLeadId);

  return NextResponse.json({ followUp }, { status: 201 });
}
