import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/registry", "/api/registry"];
const PUBLIC_PREFIXES = ["/registry/login"];

function isProtectedRoute(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtectedRoute(pathname)) {
    const res = NextResponse.next();
    res.headers.set("x-is-public-route", "1");
    return res;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/registry/login", req.url));
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: {
        getItem: (key: string) => req.cookies.get(key)?.value ?? null,
        setItem: () => {},
        removeItem: () => {},
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL("/registry/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let userRole: string | null = null;
  const { data: profile } = await supabase
    .from("staff_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile) {
    userRole = profile.role;
  }

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-user-id", user.id);
  if (userRole) reqHeaders.set("x-user-role", userRole);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("x-user-id", user.id);
  if (userRole) res.headers.set("x-user-role", userRole);

  return res;
}

export const config = {
  matcher: ["/registry/:path*", "/api/registry/:path*"],
};
