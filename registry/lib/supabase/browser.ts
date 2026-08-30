"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

function cookieStorage() {
  return {
    getItem: (key: string) => {
      const match = document.cookie.match(new RegExp("(^| )" + key + "=([^;]+)"));
      return match ? decodeURIComponent(match[2]) : null;
    },
    setItem: (key: string, value: string) => {
      document.cookie = key + "=" + encodeURIComponent(value) + "; path=/; max-age=" + (60 * 60 * 24 * 7) + "; SameSite=Lax";
    },
    removeItem: (key: string) => {
      document.cookie = key + "=; path=/; max-age=0";
    },
  };
}

let client: SupabaseClient<Database> | null = null;

export function createBrowserClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: cookieStorage(),
    },
  });

  return client;
}
