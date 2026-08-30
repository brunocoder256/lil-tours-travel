import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { normalizePhone } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "clients.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search")?.trim() || "";
    const district = searchParams.get("district")?.trim() || "";

    let query = supabase
      .from("clients")
      .select("id, full_name, phone, email, district, created_at", { count: "exact" });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (district) {
      query = query.eq("district", district);
    }

    const { data: clients, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      clients: clients || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error("[api/registry/clients] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "clients.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 10000) return NextResponse.json({ error: "Payload too large" }, { status: 400 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const fullName = typeof b.full_name === "string" ? b.full_name.trim() : "";
  const rawPhone = typeof b.phone === "string" ? b.phone.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const district = typeof b.district === "string" ? b.district.trim() : "";
  const dateOfBirth = typeof b.date_of_birth === "string" ? b.date_of_birth.trim() : "";

  if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (!rawPhone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();
    const phone = normalizePhone(rawPhone);

    // Duplicate check
    const { data: existing } = await supabase
      .from("clients")
      .select("id, full_name")
      .eq("phone", phone)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A client with this phone number already exists", existingClient: existing },
        { status: 409 }
      );
    }

    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        full_name: fullName,
        phone,
        email: email || null,
        district: district || null,
        date_of_birth: dateOfBirth || null,
      })
      .select("id, full_name, phone, email, district, created_at")
      .single();

    if (error) {
      console.error("[api/registry/clients] Create error:", error);
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (err) {
    console.error("[api/registry/clients] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
