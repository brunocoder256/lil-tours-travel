import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { user, profile };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.user || !session.profile) return null;
  return session;
}
