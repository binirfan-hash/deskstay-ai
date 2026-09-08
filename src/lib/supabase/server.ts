import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Next.js 15 made `cookies()` async — it MUST be awaited. `setAll` writes the
 * refreshed auth tokens back to the cookie store; in RSC/Server Actions that
 * write throws when called outside a mutation, which is expected — the
 * middleware session refresh (src/lib/supabase/middleware.ts) is what keeps
 * tokens fresh, so the write failure is caught and ignored here.
 *
 * Create a NEW client per request — never cache it across requests.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render — middleware refreshes sessions.
        }
      },
    },
  });
}