import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("full_name, role, is_active")
      .eq("user_id", userId)
      .single();

    if (!profile || !profile.is_active) {
      return NextResponse.json({ authenticated: false }, { status: 403 });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: userId, ...profile },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
