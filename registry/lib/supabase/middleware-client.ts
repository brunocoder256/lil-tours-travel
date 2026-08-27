import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { NextRequest, NextResponse } from "next/server";

export function createSupabaseMiddlewareClient(
  req: NextRequest,
  res: NextResponse
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!supabaseAnonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: {
        getItem: (key: string) => req.cookies.get(key)?.value ?? null,
        setItem: (key: string, value: string) => {
          res.cookies.set(key, value, { path: "/", httpOnly: true, sameSite: "lax" });
        },
        removeItem: (key: string) => {
          res.cookies.set(key, "", { path: "/", maxAge: 0 });
        },
      },
    },
  });
}
