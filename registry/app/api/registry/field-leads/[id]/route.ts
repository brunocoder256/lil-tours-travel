import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { normalizePhone } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "field_leads.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServerClient();

  const { data: lead, error } = await supabase
    .from("field_leads")
    .select(`
      *,
      creator:staff_profiles!field_leads_created_by_fkey(full_name, phone),
      assignee:staff_profiles!field_leads_assigned_to_fkey(full_name, phone),
      converted_client:clients(full_name, phone)
    `)
    .eq("id", id)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Field lead not found" }, { status: 404 });
  }

  // Ownership check for field marketers
  if (userRole === "field_marketer" && !hasPermission(userRole, "field_leads.view_all")) {
    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (profile && lead.created_by !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const creator = lead.creator as { full_name: string; phone: string } | null;
  const assignee = lead.assignee as { full_name: string; phone: string } | null;
  const convertedClient = lead.converted_client as { full_name: string; phone: string } | null;

  return NextResponse.json({
    lead: {
      ...lead,
      creator_name: creator?.full_name || "Unknown",
      creator_phone: creator?.phone || null,
      assignee_name: assignee?.full_name || null,
      assignee_phone: assignee?.phone || null,
      converted_client_name: convertedClient?.full_name || null,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "field_leads.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const body = rawBody as Record<string, unknown>;

  const updateFields: { full_name?: string; phone?: string; email?: string | null; district?: string | null; date_of_birth?: string | null; service_interest?: string; status?: string; source?: string; notes?: string | null; assigned_to?: string | null; next_follow_up_at?: string | null; last_contacted_at?: string | null } = {};

  if (typeof body.fullName === "string") {
    const name = body.fullName.trim();
    if (!name) return NextResponse.json({ error: "Full name cannot be empty" }, { status: 400 });
    updateFields.full_name = name;
  }
  if (typeof body.phone === "string") updateFields.phone = normalizePhone(body.phone.trim());
  if (typeof body.email === "string") {
    const e = body.email.trim();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    updateFields.email = e || null;
  }
  if (typeof body.district === "string") updateFields.district = body.district.trim() || null;
  if (typeof body.dateOfBirth === "string") updateFields.date_of_birth = body.dateOfBirth.trim() || null;
  if (typeof body.serviceInterest === "string") {
    const s = body.serviceInterest.trim().toLowerCase().replace(/\s+/g, "_");
    const validServices = ["tourism", "work_abroad", "visa", "passport", "air_ticket", "hotel", "airbnb", "car_hire", "delivery", "consultancy"];
    if (!validServices.includes(s)) return NextResponse.json({ error: `Invalid service: ${s}` }, { status: 400 });
    updateFields.service_interest = s;
  }
  if (typeof body.status === "string") {
    const validStatuses = ["new", "contacted", "interested", "follow_up", "converted", "not_interested", "lost"];
    if (!validStatuses.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    updateFields.status = body.status;
  }
  if (typeof body.source === "string") {
    const s = body.source.trim().toLowerCase().replace(/\s+/g, "_");
    const validSources = ["field_marketing", "office_visit", "referral", "event", "social_media", "phone", "whatsapp", "other"];
    if (!validSources.includes(s)) return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    updateFields.source = s;
  }
  if (typeof body.notes === "string") updateFields.notes = body.notes.trim() || null;
  if (typeof body.assignedTo === "string") {
    if (!hasPermission(userRole, "field_leads.assign")) {
      delete body.assignedTo;
    } else {
      updateFields.assigned_to = body.assignedTo.trim() || null;
    }
  }
  if (typeof body.nextFollowUp === "string") updateFields.next_follow_up_at = body.nextFollowUp.trim() || null;
  if (typeof body.lastContactedAt === "string") updateFields.last_contacted_at = body.lastContactedAt.trim() || null;

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Ownership check for field marketers
  if (userRole === "field_marketer" && !hasPermission(userRole, "field_leads.view_all")) {
    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (profile) {
      const { data: existing } = await supabase.from("field_leads").select("created_by").eq("id", id).single();
      if (existing && existing.created_by !== profile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const { data: lead, error } = await supabase
    .from("field_leads")
    .update(updateFields)
    .eq("id", id)
    .select("id, full_name, phone, status, assigned_to, updated_at")
    .single();

  if (error) {
    console.error("[api/registry/field-leads/[id]] Update error:", error);
    return NextResponse.json({ error: "Failed to update field lead" }, { status: 500 });
  }

  return NextResponse.json({ lead });
}
