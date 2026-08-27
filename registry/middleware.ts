import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/registry"];
const PUBLIC_PREFIXES = ["/registry/login"];

function isProtectedRoute(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/registry/login", req.url));
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL("/registry/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  res.headers.set("x-user-id", user.id);

  return res;
}

export const config = {
  matcher: ["/registry/:path*"],
};
