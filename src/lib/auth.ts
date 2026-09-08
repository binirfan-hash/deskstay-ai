import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserPublic } from "@/lib/types";

/**
 * Auth — thin wrapper over Supabase Auth (contract amendment A2).
 * Replaces the old bcrypt + SQLite cookie-session implementation (src/lib/db.ts
 * is deleted). Email confirmation is disabled for the demo (auto-confirm), so
 * signup returns a session immediately.
 *
 * All functions accept an optional pre-built client (server or browser). When
 * omitted they lazily build the server client — awaiting it, since
 * src/lib/supabase/server.ts exports an async factory (Next 15 async cookies()).
 */

/** Resolves either a SupabaseClient or a Promise of one into a client. */
async function resolve(
  client?: SupabaseClient | Promise<SupabaseClient>,
): Promise<SupabaseClient> {
  if (!client) {
    const mod = await import("@/lib/supabase/server");
    return mod.createClient();
  }
  return client instanceof Promise ? await client : client;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface SignUpResult {
  ok: boolean;
  user: UserPublic | null;
  error?: string;
}

/** Signup — creates the auth user; the handle_new_user DB trigger inserts public.profiles. */
export async function signUp(
  { email, password, name }: SignUpInput,
  client?: SupabaseClient | Promise<SupabaseClient>,
): Promise<SignUpResult> {
  const supabase = await resolve(client);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return { ok: false, user: null, error: error.message };

  const user = data.user
    ? {
        id: data.user.id,
        name,
        email: data.user.email ?? email,
        avatarUrl: (data.user.user_metadata?.avatar_url as string | undefined) ?? null,
        superhost: false,
        createdAt: data.user.created_at ?? new Date().toISOString(),
      }
    : null;

  return { ok: true, user };
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function signIn(
  email: string,
  password: string,
  client?: SupabaseClient | Promise<SupabaseClient>,
): Promise<AuthResult> {
  const supabase = await resolve(client);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut(
  client?: SupabaseClient | Promise<SupabaseClient>,
): Promise<AuthResult> {
  const supabase = await resolve(client);
  const { error } = await supabase.auth.signOut();
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * GET /api/auth/me equivalent — resolves the signed-in user's profile row from
 * public.profiles (RLS: auth.uid() = id). Returns null when unauthenticated.
 */
export async function getCurrentProfile(
  client?: SupabaseClient | Promise<SupabaseClient>,
): Promise<UserPublic | null> {
  const supabase = await resolve(client);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url, superhost, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(`getCurrentProfile: ${error.message}`);
  if (!data) return null;

  const row = data as {
    id: string;
    name: string;
    email: string | null;
    avatar_url: string | null;
    superhost: boolean;
    created_at: string;
  };

  return {
    id: row.id,
    name: row.name,
    email: row.email ?? user.email ?? "",
    avatarUrl: row.avatar_url,
    superhost: row.superhost,
    createdAt: row.created_at,
  };
}