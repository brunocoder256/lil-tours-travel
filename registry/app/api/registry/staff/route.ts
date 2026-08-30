import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hasPermission, isValidRole } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "staff.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
    const activeOnly = searchParams.get("active_only") === "1";

    let query = supabase
      .from("staff_profiles")
      .select("id, user_id, full_name, phone, role, is_active, created_at, updated_at", { count: "exact" });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq("role", role);
    }
    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: staff, count } = await query.order("created_at", { ascending: false });

    return NextResponse.json({
      staff: staff || [],
      total: count || 0,
    });
  } catch (err) {
    console.error("[api/registry/staff] List error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role");
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(userRole, "staff.manage")) {
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
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const fullName = typeof b.full_name === "string" ? b.full_name.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  const role = typeof b.role === "string" ? b.role.trim() : "data_entrant";

  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  if (!isValidRole(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.includes("already")) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
      console.error("[api/registry/staff] Auth create error:", authError);
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
    }

    if (!authUser.user) {
      return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("staff_profiles")
      .insert({
        user_id: authUser.user.id,
        full_name: fullName,
        phone: phone || null,
        role,
        is_active: true,
      })
      .select("id, user_id, full_name, phone, role, is_active, created_at")
      .single();

    if (profileError) {
      console.error("[api/registry/staff] Profile create error:", profileError);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: "Failed to create staff profile" }, { status: 500 });
    }

    return NextResponse.json({ staff: profile }, { status: 201 });
  } catch (err) {
    console.error("[api/registry/staff] Create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
