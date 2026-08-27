import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";

const VALID_STATUSES = ["pending", "completed", "missed", "cancelled"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "followups.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  interface FollowUpUpdate {
    status?: string;
    due_at?: string;
    notes?: string | null;
    outcome?: string | null;
    assigned_to?: string;
  }

  const updateFields: FollowUpUpdate = {};

  if (typeof body.status === "string") {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateFields.status = body.status;
  }

  if (typeof body.dueAt === "string") {
    updateFields.due_at = body.dueAt;
  }

  if (typeof body.notes === "string") {
    updateFields.notes = body.notes.trim() || null;
  }

  if (typeof body.outcome === "string") {
    updateFields.outcome = body.outcome.trim() || null;
  }

  if (typeof body.assignedTo === "string") {
    if (!hasPermission(userRole, "field_leads.assign")) {
      return NextResponse.json({ error: "Cannot reassign follow-ups" }, { status: 403 });
    }
    updateFields.assigned_to = body.assignedTo;
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: followUp, error } = await supabase
    .from("follow_ups")
    .update(updateFields)
    .eq("id", id)
    .select("id, status, due_at, updated_at")
    .single();

  if (error) {
    console.error("[api/registry/follow-ups/[id]] Update error:", error);
    return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
  }

  // If completed, update lead's last_contacted_at
  if (updateFields.status === "completed") {
    const { data: fu } = await supabase
      .from("follow_ups")
      .select("field_lead_id")
      .eq("id", id)
      .single();

    if (fu) {
      await supabase
        .from("field_leads")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", fu.field_lead_id);
    }
  }

  return NextResponse.json({ followUp });
}
