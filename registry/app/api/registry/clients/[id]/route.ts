import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireApiAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { normalizePhone } from "@/lib/validation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "clients.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const supabase = createServerClient();

    const { data: client, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Also fetch enquiries for this client
    const { data: enquiries } = await supabase
      .from("enquiries")
      .select("id, service, destination, status, source, preferred_date, notes, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ client, enquiries: enquiries || [] });
  } catch (err) {
    console.error("[api/registry/clients/[id]] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId, userRole } = auth;
  if (!hasPermission(userRole, "clients.update")) {
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
  const updateFields: { full_name?: string; phone?: string; email?: string | null; district?: string | null; date_of_birth?: string | null } = {};

  if (typeof b.full_name === "string") {
    const name = b.full_name.trim();
    if (!name) return NextResponse.json({ error: "Full name cannot be empty" }, { status: 400 });
    updateFields.full_name = name;
  }
  if (typeof b.phone === "string") {
    updateFields.phone = normalizePhone(b.phone.trim());
  }
  if (typeof b.email === "string") {
    const email = b.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    updateFields.email = email || null;
  }
  if (typeof b.district === "string") {
    updateFields.district = b.district.trim() || null;
  }
  if (typeof b.date_of_birth === "string") {
    updateFields.date_of_birth = b.date_of_birth.trim() || null;
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data: client, error } = await supabase
      .from("clients")
      .update(updateFields)
      .eq("id", id)
      .select("id, full_name, phone, email, district, date_of_birth, created_at, updated_at")
      .single();

    if (error) {
      console.error("[api/registry/clients/[id]] Update error:", error);
      return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
    }

    return NextResponse.json({ client });
  } catch (err) {
    console.error("[api/registry/clients/[id]] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
