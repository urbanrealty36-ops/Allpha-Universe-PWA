import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!url || !publishableKey || !apiUrl) return response;
  if (request.nextUrl.pathname.startsWith("/auth")) return response;

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const permissionResponse = await fetch(
    `${apiUrl.replace(/\/$/, "")}/api/v1/auth/permissions`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  ).catch(() => null);

  if (!permissionResponse?.ok) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const permissions = (await permissionResponse.json()) as { roles?: string[] };
  const roles = permissions.roles ?? [];
  if (!roles.includes("platform_admin") && !roles.includes("super_admin")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
