import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

const VALID_STATUSES = ["new","contacted","in_progress","completed","cancelled"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "enquiries.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const supabase = createServerClient();

    const { data: enquiry, error } = await supabase
      .from("enquiries")
      .select("*, clients(id, full_name, phone, email, district)")
      .eq("id", id)
      .single();

    if (error || !enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ enquiry });
  } catch (err) {
    console.error("[api/registry/enquiries/[id]] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "enquiries.update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 10000) return NextResponse.json({ error: "Payload too large" }, { status: 400 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const updateFields: { status?: string; destination?: string | null; preferred_date?: string | null; notes?: string | null } = {};

  if (typeof b.status === "string") {
    const status = b.status.trim();
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateFields.status = status;
  }
  if (typeof b.destination === "string") {
    updateFields.destination = b.destination.trim() || null;
  }
  if (typeof b.preferred_date === "string") {
    updateFields.preferred_date = b.preferred_date.trim() || null;
  }
  if (typeof b.notes === "string") {
    updateFields.notes = b.notes.trim() || null;
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data: enquiry, error } = await supabase
      .from("enquiries")
      .update(updateFields)
      .eq("id", id)
      .select("id, client_id, service, destination, status, source, preferred_date, notes, created_at, updated_at")
      .single();

    if (error) {
      console.error("[api/registry/enquiries/[id]] Update error:", error);
      return NextResponse.json({ error: "Failed to update enquiry" }, { status: 500 });
    }

    return NextResponse.json({ enquiry });
  } catch (err) {
    console.error("[api/registry/enquiries/[id]] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
