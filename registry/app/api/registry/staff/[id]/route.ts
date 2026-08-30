import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isValidRole } from "@/lib/permissions";

async function verifyAdmin(userId: string) {
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("role, is_active")
    .eq("user_id", userId)
    .single();
  if (!profile || !profile.is_active || profile.role !== "admin") return null;
  return profile;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await verifyAdmin(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const supabase = createServerClient();
    const { data: staff, error } = await supabase
      .from("staff_profiles")
      .select("id, user_id, full_name, phone, role, is_active, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error || !staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (err) {
    console.error("[api/registry/staff/:id] Get error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await verifyAdmin(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  const updates: { full_name?: string; phone?: string | null; role?: string; is_active?: boolean } = {};

  if (b.full_name !== undefined) {
    const fullName = typeof b.full_name === "string" ? b.full_name.trim() : "";
    if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    updates.full_name = fullName;
  }
  if (b.phone !== undefined) {
    updates.phone = typeof b.phone === "string" && b.phone.trim() ? b.phone.trim() : null;
  }
  if (b.role !== undefined) {
    const role = typeof b.role === "string" ? b.role.trim() : "";
    if (!isValidRole(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updates.role = role;
  }
  if (b.is_active !== undefined) {
    updates.is_active = Boolean(b.is_active);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data: existing } = await supabase
      .from("staff_profiles")
      .select("id, user_id, role")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (existing.user_id === userId && updates.is_active === false) {
      return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
    }
    if (existing.user_id === userId && updates.role && updates.role !== existing.role) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const { data: staff, error } = await supabase
      .from("staff_profiles")
      .update(updates)
      .eq("id", id)
      .select("id, user_id, full_name, phone, role, is_active, created_at, updated_at")
      .single();

    if (error) {
      console.error("[api/registry/staff/:id] Update error:", error);
      return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
    }

    return NextResponse.json({ staff });
  } catch (err) {
    console.error("[api/registry/staff/:id] Update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await verifyAdmin(userId);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const supabase = createServerClient();

    const { data: existing } = await supabase
      .from("staff_profiles")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (existing.user_id === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await supabase.auth.admin.deleteUser(existing.user_id);

    const { error } = await supabase
      .from("staff_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[api/registry/staff/:id] Delete error:", error);
      return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/registry/staff/:id] Delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
