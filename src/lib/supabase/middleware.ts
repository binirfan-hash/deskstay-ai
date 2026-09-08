import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase session refresh middleware (called from src/middleware.ts).
 *
 * Runs the request through a Supabase server client whose `setAll` writes
 * refreshed auth tokens onto the outgoing response. Without this, a user whose
 * access token expires mid-session gets silently logged out on the next
 * server-side `getUser()`.
 *
 * Also gates the auth pages: a signed-in user hitting /login or /signup is
 * redirected home.
 *
 * The user MUST call `supabase.auth.getUser()` (or getClaims) at least once —
 * that is what triggers the token refresh + cookie write-back.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Env not wired yet: pass through rather than hard-crash every route.
  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response.headers.append(
          "Cache-Control",
          "private, no-cache, no-store, must-revalidate, max-age=0",
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: do not remove — this refreshes an expired session and writes
  // the new tokens back through setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}