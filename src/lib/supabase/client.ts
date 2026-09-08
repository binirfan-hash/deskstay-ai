import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client (Client Components).
 * Session is persisted in cookies by @supabase/ssr so the server can read it.
 * `isSingleton` keeps one instance per tab (avoids duplicate GoTrue listeners).
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable
 * anon key only — safe for the client bundle; see collab/contract-amendments.md A5).
 */
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, { isSingleton: true });
}