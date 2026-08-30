import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { normalizePhone, validateFieldLead } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "field_leads.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const service = searchParams.get("service") || "";
  const source = searchParams.get("source") || "";
  const district = searchParams.get("district") || "";
  const assignedTo = searchParams.get("assignedTo") || "";
  const createdBy = searchParams.get("createdBy") || "";
  const view = searchParams.get("view") || ""; // "my" for own leads
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "25", 10), 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("field_leads")
    .select(`
      id, full_name, phone, email, district, service_interest, status, source,
      created_by, assigned_to, created_at, next_follow_up_at, converted_client_id,
      last_contacted_at,
      creator:staff_profiles!field_leads_created_by_fkey(full_name),
      assignee:staff_profiles!field_leads_assigned_to_fkey(full_name)
    `, { count: "exact" });

  // Ownership filter: field marketers see only own leads unless view_all
  if (view === "my" || (!hasPermission(userRole, "field_leads.view_all") && userRole === "field_marketer")) {
    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (profile) {
      query = query.eq("created_by", profile.id);
    }
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,district.ilike.%${search}%`);
  }
  if (status) query = query.eq("status", status);
  if (service) query = query.eq("service_interest", service);
  if (source) query = query.eq("source", source);
  if (district) query = query.ilike("district", `%${district}%`);
  if (assignedTo) query = query.eq("assigned_to", assignedTo);
  if (createdBy) query = query.eq("created_by", createdBy);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[api/registry/field-leads] Error:", error);
    return NextResponse.json({ error: "Failed to fetch field leads" }, { status: 500 });
  }

  const leads = (data || []).map((lead: Record<string, unknown>) => {
    const creator = lead.creator as { full_name: string } | null;
    const assignee = lead.assignee as { full_name: string } | null;
    return {
      id: lead.id,
      full_name: lead.full_name,
      phone: lead.phone,
      email: lead.email,
      district: lead.district,
      service_interest: lead.service_interest,
      status: lead.status,
      source: lead.source,
      created_by: lead.created_by,
      created_by_name: creator?.full_name || "Unknown",
      assigned_to: lead.assigned_to,
      assigned_to_name: assignee?.full_name || null,
      created_at: lead.created_at,
      next_follow_up_at: lead.next_follow_up_at,
      converted_client_id: lead.converted_client_id,
      last_contacted_at: lead.last_contacted_at,
    };
  });

  return NextResponse.json({
    leads,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "field_leads.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateFieldLead(body);
  if (!validation.ok) {
    return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
  }

  const { data } = validation;
  const supabase = createServerClient();

  // Duplicate detection: check existing clients and active leads by phone
  const normalizedPhone = normalizePhone(data!.phone);

  const [existingClient, existingLead] = await Promise.all([
    supabase.from("clients").select("id, full_name, phone").eq("phone", normalizedPhone).maybeSingle(),
    supabase.from("field_leads").select("id, full_name, phone, status").eq("phone", normalizedPhone).not("status", "in", '("converted","lost","not_interested")').maybeSingle(),
  ]);

  if (existingClient.data) {
    return NextResponse.json({
      error: "duplicate_client",
      message: "This phone number matches an existing client.",
      match: { type: "client", id: existingClient.data.id, full_name: existingClient.data.full_name },
    }, { status: 409 });
  }

  if (existingLead.data) {
    return NextResponse.json({
      error: "duplicate_lead",
      message: "This phone number matches an existing active lead.",
      match: { type: "lead", id: existingLead.data.id, full_name: existingLead.data.full_name, status: existingLead.data.status },
    }, { status: 409 });
  }

  // Look up staff profile ID for created_by
  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Staff profile not found" }, { status: 400 });
  }

  interface LeadInsert {
    full_name: string;
    phone: string;
    email?: string | null;
    district?: string | null;
    date_of_birth?: string | null;
    service_interest: string;
    source: string;
    notes?: string | null;
    status: string;
    created_by: string;
    next_follow_up_at?: string;
    assigned_to?: string;
  }

  const insertData: LeadInsert = {
    full_name: data!.fullName,
    phone: normalizedPhone,
    email: data!.email,
    district: data!.district,
    date_of_birth: data!.dateOfBirth,
    service_interest: data!.serviceInterest,
    source: data!.source,
    notes: data!.notes,
    status: "new",
    created_by: profile.id,
  };

  if (data!.nextFollowUp) {
    insertData.next_follow_up_at = data!.nextFollowUp + "T09:00:00Z";
  }
  if (data!.assignedTo) {
    insertData.assigned_to = data!.assignedTo;
  }

  const { data: lead, error } = await supabase
    .from("field_leads")
    .insert(insertData)
    .select("id, full_name, phone, service_interest, status, next_follow_up_at, created_at")
    .single();

  if (error) {
    console.error("[api/registry/field-leads] Create error:", error);
    return NextResponse.json({ error: "Failed to create field lead" }, { status: 500 });
  }

  return NextResponse.json({ lead }, { status: 201 });
}
