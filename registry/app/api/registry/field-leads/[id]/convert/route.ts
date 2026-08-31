import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { normalizePhone } from "@/lib/validation";

export async function POST(
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
  const supabase = createServerClient();

  // Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from("field_leads")
    .select("*")
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Field lead not found" }, { status: 404 });
  }

  if (lead.status === "converted") {
    return NextResponse.json({ error: "Lead is already converted" }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // Allow empty body for simple conversion
  }

  const createEnquiry = body.createEnquiry !== false;
  const notes = typeof body.notes === "string" ? body.notes.trim() : null;

  // Check if client already exists
  const normalizedPhone = normalizePhone(lead.phone);
  let clientId: string;
  let clientCreated = false;

  const { data: existingClient } = await supabase
    .from("clients")
    .select("id")
    .eq("phone", normalizedPhone)
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    // Create new client
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        full_name: lead.full_name,
        phone: normalizedPhone,
        email: lead.email,
        district: lead.district,
        date_of_birth: lead.date_of_birth,
      })
      .select("id")
      .single();

    if (clientError || !newClient) {
      console.error("[api/registry/field-leads/convert] Client creation error:", clientError);
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
    clientId = newClient.id;
    clientCreated = true;
  }

  // Create enquiry if requested
  let enquiryCreated = false;
  if (createEnquiry) {
    const { error: enquiryError } = await supabase
      .from("enquiries")
      .insert({
        client_id: clientId,
        service: lead.service_interest,
        notes: notes || `Converted from field lead. ${lead.notes || ""}`.trim(),
        source: "field_marketing",
        status: "new",
      });

    if (enquiryError) {
      console.error("[api/registry/field-leads/convert] Enquiry creation error:", enquiryError);
      // Non-fatal: client was created, continue
    } else {
      enquiryCreated = true;
    }
  }

  // Update lead status
  const { error: updateError } = await supabase
    .from("field_leads")
    .update({
      status: "converted",
      converted_client_id: clientId,
    })
    .eq("id", id);

  if (updateError) {
    console.error("[api/registry/field-leads/convert] Lead update error:", updateError);
    return NextResponse.json({ error: "Failed to update lead status" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    clientId,
    clientCreated,
    enquiryCreated,
    message: clientCreated ? "New client created and enquiry added" : "Lead linked to existing client",
  });
}
