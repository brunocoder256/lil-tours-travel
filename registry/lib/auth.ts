import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return { user: null, profile: null };

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, profile: null };

  if (serviceKey) {
    const admin = createClient<Database>(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[auth] Auto-provision skipped: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
    return null;
  }

  const admin = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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

  console.log(`[auth] Auto-provisioned profile for ${email} with role: ${role}`);
  return profile;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.user || !session.profile) return null;
  return session;
}
