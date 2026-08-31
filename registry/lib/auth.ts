import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseFromCookies(cookieStore: { get: (key: string) => { value: string } | undefined }) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: {
        getItem: (key: string) => cookieStore.get(key)?.value ?? null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
  });
}

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceKey) return null;
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const supabase = getSupabaseFromCookies(cookieStore);
  if (!supabase) return { user: null, profile: null };

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, profile: null };

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data: profile } = await admin
      .from("staff_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (profile) return { user, profile };
  } else {
    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (profile) return { user, profile };
  }

  const autoProvisioned = await autoProvisionProfile(user.id, user.email || "");
  if (autoProvisioned) return { user, profile: autoProvisioned };

  return { user, profile: null };
}

async function autoProvisionProfile(userId: string, email: string) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("[auth] Auto-provision skipped: missing SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }

  const { data: existing } = await admin
    .from("staff_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) return existing;

  const { count } = await admin
    .from("staff_profiles")
    .select("id", { count: "exact", head: true });

  const role = count === 0 ? "admin" : "data_entrant";
  const displayName = email.split("@")[0] || "Staff Member";

  const { data: profile, error } = await admin
    .from("staff_profiles")
    .insert({
      user_id: userId,
      full_name: displayName,
      role,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: retryProfile } = await admin
        .from("staff_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (retryProfile) return retryProfile;
    }
    console.error("[auth] Auto-provision profile failed:", error.message, error.code, error.details);
    return null;
  }

  return profile;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.user || !session.profile) return null;
  return session;
}

function getCookieStoreFromRequest(req: NextRequest) {
  return {
    get: (key: string) => {
      const cookie = req.cookies.get(key);
      return cookie ? { value: cookie.value } : undefined;
    },
  };
}

export async function requireApiAuth(req?: NextRequest) {
  let user: { id: string; email?: string } | null = null;
  let profile: { id: string; role: string; full_name: string } | null = null;

  if (req) {
    const cookieStore = getCookieStoreFromRequest(req);
    const supabase = getSupabaseFromCookies(cookieStore);
    if (!supabase) return null;

    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error || !authUser) return null;
    user = authUser;

    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: p } = await admin
        .from("staff_profiles")
        .select("id, role, full_name")
        .eq("user_id", user.id)
        .single();
      profile = p;
    }
  } else {
    const session = await getSession();
    user = session.user;
    profile = session.profile ? { id: session.profile.id, role: session.profile.role, full_name: session.profile.full_name } : null;
  }

  if (!user || !profile) return null;
  return { userId: user.id, profileId: profile.id, userRole: profile.role };
}
