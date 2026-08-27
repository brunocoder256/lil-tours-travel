import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { normalizePhone } from "@/lib/validation";

const VALID_OPERATIONS = ["create", "update"];
const VALID_ENTITIES = ["field_lead", "follow_up"];

const VALID_SERVICES = [
  "tourism", "work_abroad", "visa", "passport", "air_ticket",
  "hotel", "airbnb", "car_hire", "delivery", "consultancy",
];

const VALID_LEAD_STATUSES = [
  "new", "contacted", "interested", "follow_up", "converted", "not_interested", "lost",
];

const VALID_LEAD_SOURCES = [
  "field_marketing", "office_visit", "referral", "event", "social_media", "phone", "whatsapp", "other",
];

const VALID_FOLLOWUP_STATUSES = ["pending", "completed", "missed", "cancelled"];

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const operationId = typeof body.operationId === "string" ? body.operationId.trim() : "";
  const operation = typeof body.operation === "string" ? body.operation.trim() : "";
  const entity = typeof body.entity === "string" ? body.entity.trim() : "";
  const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
  const payload = body.payload && typeof body.payload === "object" ? body.payload as Record<string, unknown> : null;

  if (!operationId) return NextResponse.json({ error: "operationId is required" }, { status: 400 });
  if (!VALID_OPERATIONS.includes(operation)) return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  if (!VALID_ENTITIES.includes(entity)) return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
  if (!payload) return NextResponse.json({ error: "payload is required" }, { status: 400 });

  const supabase = createServerClient();

  // Idempotency check
  const { data: existingOp } = await supabase
    .from("sync_operations")
    .select("id, result")
    .eq("operation_id", operationId)
    .maybeSingle();

  if (existingOp) {
    return NextResponse.json({ ...(existingOp.result as Record<string, unknown> || {}), idempotent: true });
  }

  // Get staff profile
  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("id, role")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Staff profile not found" }, { status: 400 });
  }

  // Permission check
  const permKey = entity === "field_lead" ? "field_leads.create" : "followups.create";
  if (!hasPermission(profile.role, permKey)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let result: Record<string, unknown> = {};

  if (entity === "field_lead" && operation === "create") {
    result = await handleCreateFieldLead(supabase, profile.id, payload, entityId);
  } else if (entity === "field_lead" && operation === "update") {
    result = await handleUpdateFieldLead(supabase, profile.id, userRole, entityId, payload);
  } else if (entity === "follow_up" && operation === "update") {
    result = await handleUpdateFollowUp(supabase, profile.id, userRole, entityId, payload);
  } else {
    return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
  }

  if (result.error) {
    return NextResponse.json(result, { status: result.status as number || 500 });
  }

  // Record the operation for idempotency
  await supabase.from("sync_operations").insert({
    operation_id: operationId,
    user_id: userId,
    staff_id: profile.id,
    operation_type: operation,
    entity_type: entity,
    entity_id: entityId,
    result: result as unknown as Record<string, string>,
  });

  return NextResponse.json(result);
}

async function handleCreateFieldLead(
  supabase: ReturnType<typeof createServerClient>,
  staffId: string,
  payload: Record<string, unknown>,
  entityId: string
): Promise<Record<string, unknown>> {
  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  const phone = typeof payload.phone === "string" ? normalizePhone(payload.phone.trim()) : "";
  const serviceInterest = typeof payload.serviceInterest === "string" ? payload.serviceInterest.trim() : "";

  if (!fullName || !phone || !serviceInterest) {
    return { error: "Missing required fields", status: 400 };
  }
  if (!VALID_SERVICES.includes(serviceInterest)) {
    return { error: "Invalid service", status: 400 };
  }

  const source = typeof payload.source === "string" ? payload.source.trim() : "field_marketing";
  if (!VALID_LEAD_SOURCES.includes(source)) {
    return { error: "Invalid source", status: 400 };
  }

  // Check for existing client
  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingClient) {
    return { error: "duplicate_client", message: "This phone matches an existing client", clientId: existingClient.id, status: 409 };
  }

  // Check for existing active lead
  const { data: existingLead } = await supabase
    .from("field_leads")
    .select("id, status")
    .eq("phone", phone)
    .not("status", "in", '("converted","lost","not_interested")')
    .maybeSingle();

  if (existingLead) {
    return { error: "duplicate_lead", message: "This phone matches an existing active lead", leadId: existingLead.id, status: 409 };
  }

  // Check idempotency by entity ID
  const { data: existingById } = await supabase
    .from("field_leads")
    .select("id")
    .eq("id", entityId)
    .maybeSingle();

  if (existingById) {
    return { serverId: existingById.id, idempotent: true };
  }

  interface LeadInsert {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    district: string | null;
    date_of_birth: string | null;
    service_interest: string;
    source: string;
    notes: string | null;
    status: string;
    created_by: string;
    next_follow_up_at?: string;
  }

  const insertData: LeadInsert = {
    id: entityId,
    full_name: fullName,
    phone,
    email: typeof payload.email === "string" ? payload.email.trim() || null : null,
    district: typeof payload.district === "string" ? payload.district.trim() || null : null,
    date_of_birth: typeof payload.dateOfBirth === "string" ? payload.dateOfBirth.trim() || null : null,
    service_interest: serviceInterest,
    source,
    notes: typeof payload.notes === "string" ? payload.notes.trim() || null : null,
    status: "new",
    created_by: staffId,
  };

  if (typeof payload.nextFollowUp === "string" && payload.nextFollowUp) {
    insertData.next_follow_up_at = payload.nextFollowUp + "T09:00:00Z";
  }

  const { data: lead, error } = await supabase
    .from("field_leads")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("[api/sync] Create field lead error:", error);
    return { error: "Failed to create field lead", status: 500 };
  }

  return { serverId: lead.id };
}

async function handleUpdateFieldLead(
  supabase: ReturnType<typeof createServerClient>,
  staffId: string,
  userRole: string,
  entityId: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Fetch existing lead for ownership check
  const { data: existing } = await supabase
    .from("field_leads")
    .select("id, created_by, version")
    .eq("id", entityId)
    .single();

  if (!existing) {
    return { error: "Lead not found", status: 404 };
  }

  // Ownership check for field marketers
  if (userRole === "field_marketer" && !hasPermission(userRole, "field_leads.view_all")) {
    if (existing.created_by !== staffId) {
      return { error: "Forbidden", status: 403 };
    }
  }

  // Conflict detection via version
  const clientVersion = typeof payload.version === "number" ? payload.version : null;
  if (clientVersion !== null && clientVersion < existing.version) {
    return { conflict: true, serverVersion: existing.version, clientVersion, status: 409 };
  }

  interface LeadUpdate {
    status?: string;
    notes?: string | null;
    next_follow_up_at?: string | null;
  }

  const updateFields: LeadUpdate = {};
  if (typeof payload.status === "string" && VALID_LEAD_STATUSES.includes(payload.status)) {
    updateFields.status = payload.status;
  }
  if (typeof payload.notes === "string") {
    updateFields.notes = payload.notes.trim() || null;
  }
  if (typeof payload.nextFollowUp === "string") {
    updateFields.next_follow_up_at = payload.nextFollowUp || null;
  }

  if (Object.keys(updateFields).length === 0) {
    return { error: "No valid fields to update", status: 400 };
  }

  const { error } = await supabase
    .from("field_leads")
    .update(updateFields)
    .eq("id", entityId);

  if (error) {
    return { error: "Failed to update lead", status: 500 };
  }

  return { updated: true };
}

async function handleUpdateFollowUp(
  supabase: ReturnType<typeof createServerClient>,
  staffId: string,
  userRole: string,
  entityId: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const { data: existing } = await supabase
    .from("follow_ups")
    .select("id, assigned_to, version")
    .eq("id", entityId)
    .single();

  if (!existing) {
    return { error: "Follow-up not found", status: 404 };
  }

  // Ownership check
  if (userRole === "field_marketer" && existing.assigned_to !== staffId) {
    return { error: "Forbidden", status: 403 };
  }

  const clientVersion = typeof payload.version === "number" ? payload.version : null;
  if (clientVersion !== null && clientVersion < existing.version) {
    return { conflict: true, serverVersion: existing.version, clientVersion, status: 409 };
  }

  interface FollowUpUpdate {
    status?: string;
    outcome?: string | null;
    notes?: string | null;
  }

  const updateFields: FollowUpUpdate = {};
  if (typeof payload.status === "string" && VALID_FOLLOWUP_STATUSES.includes(payload.status)) {
    updateFields.status = payload.status;
  }
  if (typeof payload.outcome === "string") {
    updateFields.outcome = payload.outcome.trim() || null;
  }
  if (typeof payload.notes === "string") {
    updateFields.notes = payload.notes.trim() || null;
  }

  if (Object.keys(updateFields).length === 0) {
    return { error: "No valid fields to update", status: 400 };
  }

  const { error } = await supabase
    .from("follow_ups")
    .update(updateFields)
    .eq("id", entityId);

  if (error) {
    return { error: "Failed to update follow-up", status: 500 };
  }

  return { updated: true };
}
