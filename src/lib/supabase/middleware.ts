import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

/**
 * Refreshes the Supabase auth session cookie on every request. Required by
 * @supabase/ssr so that Server Components (which can't write cookies
 * themselves) always see an up-to-date session.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: avoid writing logic between createServerClient and
  // supabase.auth.getUser() — a simple mistake could make it very hard to
  // debug issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth");
  const isPendingRoute = pathname.startsWith("/pending");
  // /admin is exempt from the approval-status check below (not from the
  // sign-in check above) so an admin/ceo account can never get stuck in a
  // redirect loop or locked out of the one tool that could fix its own
  // approval_status. Role gating for /admin itself happens in the page and
  // in each Server Action, independent of this.
  const isAdminRoute = pathname.startsWith("/admin");

  // Redirect unauthenticated users away from protected routes.
  if (!user) {
    if (!isAuthRoute && pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Redirect signed-in-but-not-yet-approved users to /pending, regardless
  // of which route they're hitting (except the exemptions above — those
  // would otherwise create a redirect loop or a lockout).
  if (!isAuthRoute && !isPendingRoute && !isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approval_status")
      .eq("id", user.id)
      .single();

    // Fails closed: a missing/errored profile row is treated the same as
    // "not approved" rather than silently letting the request through.
    if (profile?.approval_status !== "approved") {
      const url = request.nextUrl.clone();
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
