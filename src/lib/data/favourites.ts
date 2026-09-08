import type { DataFailure, ListingSummary } from "@/lib/types";

/**
 * Favourites — saved page (contract §3.5 / §3.6). RLS scopes every read/write
 * to auth.uid(), so no user_id is passed in from callers.
 */

export type ToggleResult =
  | { ok: true; listingId: string; favourited: boolean }
  | ({ ok: false } & DataFailure);

/** POST /api/favourites/toggle equivalent — insert the favourite if absent, delete it if present. */
export async function toggleFavourite(listingId: string): Promise<ToggleResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthorized", message: "Sign in to save listings" };

  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .maybeSingle();
  if (listingErr) throw new Error(`toggleFavourite listing check: ${listingErr.message}`);
  if (!listing) return { ok: false, reason: "not_found", message: "Listing not found" };

  const { data: existing, error: selErr } = await supabase
    .from("favourites")
    .select("listing_id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();
  if (selErr) throw new Error(`toggleFavourite select: ${selErr.message}`);

  if (existing) {
    const { error: delErr } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);
    if (delErr) throw new Error(`toggleFavourite delete: ${delErr.message}`);
    return { ok: true, listingId, favourited: false };
  }

  const { error: insErr } = await supabase
    .from("favourites")
    .insert({ user_id: user.id, listing_id: listingId });
  if (insErr) throw new Error(`toggleFavourite insert: ${insErr.message}`);
  return { ok: true, listingId, favourited: true };
}

export type FavouritesResult =
  | { ok: true; listings: ListingSummary[] }
  | ({ ok: false } & DataFailure);

/** GET /api/favourites equivalent — newest favourite first (contract §3.6). */
export async function getFavourites(): Promise<FavouritesResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthorized", message: "Sign in to view saved listings" };

  const { data, error } = await supabase
    .from("favourites")
    .select(
      `listing_id, created_at,
       listings (id, name, city, country, price_cents, guests, bedrooms, beds, bathrooms,
                 rating_avg, rating_count, category_id, active,
                 wifi_mbps, desk_quality, noise_level, safety_score, cafes_nearby,
                 timezone, deskstay_score,
                 listing_photos (url, sort_order))`,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getFavourites: ${error.message}`);

  const rows = (data ?? []) as unknown as {
    listing_id: string;
    created_at: string;
    listings: {
      id: string;
      name: string;
      city: string;
      country: string;
      price_cents: number;
      guests: number;
      bedrooms: number;
      beds: number;
      bathrooms: number;
      rating_avg: number;
      rating_count: number;
      category_id: string;
      active: boolean;
      wifi_mbps?: number | null;
      desk_quality?: number | null;
      noise_level?: number | null;
      safety_score?: number | null;
      cafes_nearby?: number | null;
      timezone?: string | null;
      deskstay_score?: number | null;
      listing_photos: { url: string; sort_order: number }[];
    } | null;
  }[];

  const listings: ListingSummary[] = [];
  for (const row of rows) {
    const l = row.listings;
    if (!l || !l.active) continue; // hidden/deleted listing: drop from the saved grid
    const photos = [...(l.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    listings.push({
      id: l.id,
      name: l.name,
      city: l.city,
      country: l.country,
      priceCents: l.price_cents,
      guests: l.guests,
      bedrooms: l.bedrooms,
      beds: l.beds,
      bathrooms: l.bathrooms,
      ratingAvg: l.rating_avg,
      ratingCount: l.rating_count,
      coverUrl: photos[0]?.url ?? null,
      categoryId: l.category_id,
      isFavourite: true, // by definition — it's on the saved page
      wifiMbps: l.wifi_mbps ?? null,
      deskQuality: l.desk_quality ?? null,
      noiseLevel: l.noise_level ?? null,
      safetyScore: l.safety_score ?? null,
      cafesNearby: l.cafes_nearby ?? null,
      timezone: l.timezone ?? null,
      deskstayScore: l.deskstay_score ?? null,
      });
  }

  return { ok: true, listings };
}