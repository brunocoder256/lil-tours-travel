"use client";

import { createBrowserClient as createSupaBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  return createSupaBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return document.cookie.split(";").map((c) => {
          const [name, ...rest] = c.trim().split("=");
          return { name, value: rest.join("=") };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          let cookie = `${name}=${value}`;
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
          if (options?.path) cookie += `; path=${options.path}`;
          if (options?.domain) cookie += `; domain=${options.domain}`;
          if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
          if (options?.secure) cookie += "; secure";
          document.cookie = cookie;
        });
      },
    },
  });
}
