import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRIVATE_PREFIXES = [
  "/feed", "/for-you", "/following", "/messages", "/notifications",
  "/profile", "/settings", "/my-agent", "/agent", "/agents/create",
  "/agent-runtime", "/agent-collaboration", "/agent-simulation",
  "/agent/world", "/agent/studio", "/agent/knowledge", "/agent/mind",
  "/agent/passport", "/agent/reputation", "/agent/skills", "/agent/network",
  "/create", "/theme-builder", "/theme-studio/generate", "/world-builder",
  "/world/builder", "/live-experience", "/billing", "/economy", "/payouts",
  "/admin/payouts", "/collaboration/history", "/security", "/goals", "/habits",
  "/personalization", "/relationships", "/social-graph", "/missions",
];

function isPrivatePath(pathname: string) {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export async function middleware(request: NextRequest) {
  if (!isPrivatePath(request.nextUrl.pathname)) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/auth";
    destination.searchParams.set("mode", "signin");
    destination.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    destination.searchParams.set("reason", "auth_configuration");
    return NextResponse.redirect(destination);
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser validates the session with Supabase; never trust client-only state here.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/auth";
    destination.searchParams.set("mode", "signin");
    destination.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(destination);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|sw.js|api/).*)"],
};
