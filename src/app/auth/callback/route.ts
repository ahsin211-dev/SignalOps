import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  if (!url || !key || !code) {
    return NextResponse.redirect(new URL("/login?error=config", requestUrl.origin));
  }
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return response.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as never)
        );
      },
    },
  });
  await supabase.auth.exchangeCodeForSession(code);
  return response;
}
