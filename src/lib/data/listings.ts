import type {
  DataFailure,
  ListingDetail,
  ListingPhoto,
  Listing,
  ListingSummary,
  Profile,
  Quote,
} from "@/lib/types";

/**
 * Listings — list with filters (contract §3.1) + detail (§3.2) + quote (§3.3).
 * All money is integer cents. `rating_avg` is numeric(2,1) in Postgres and is
 * cast to ::float in every select so PostgREST returns a JSON number.
 */

export interface ListingFilters {
  q?: string; // case-insensitive match on name/city/country
  category?: string; // category SLUG
  guests?: number; // guests >= n
  minPrice?: number; // cents/night, inclusive
  maxPrice?: number; // cents/night, inclusive
  checkIn?: string; // YYYY-MM-DD — exclude listings with overlapping confirmed bookings
  checkOut?: string; // YYYY-MM-DD (exclusive)
  sort?: "newest" | "price_asc" | "price_desc" | "rating_desc";
  limit?: number; // default 24, max 50
  offset?: number;
}

export type ListingsResult =
  | { ok: true; listings: ListingSummary[]; total: number; limit: number; offset: number }
  | ({ ok: false } & DataFailure);

const SUMMARY_COLUMNS =
  "id, name, city, country, price_cents, guests, bedrooms, beds, bathrooms, " +
  "rating_avg:rating_avg::float, rating_count, category_id, " +
  "wifi_mbps, desk_quality, noise_level, safety_score, cafes_nearby, " +
  "timezone, deskstay_score, " +
  "listing_photos (url, sort_order)";

const DETAIL_COLUMNS =
  `id, host_id, category_id, name, description, city, country, address,
   price_cents, guests, bedrooms, beds, bathrooms, amenities,
   rating_avg:rating_avg::float, rating_count, instant_book, created_at,
   wifi_mbps, desk_quality, noise_level, safety_score, cafes_nearby,
   timezone, deskstay_score,
   listing_photos (id, url, alt, sort_order),
   profiles:profiles!listings_host_id_fkey (id, name, avatar_url, superhost, created_at)`;

/** Row shape returned by the summary select (photos embedded, un-ordered by PostgREST). */
interface SummaryRow {
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
  // Work-readiness columns (migration 003) — nullable, null-safe by contract.
  wifi_mbps?: number | null;
  desk_quality?: number | null;
  noise_level?: number | null;
  safety_score?: number | null;
  cafes_nearby?: number | null;
  timezone?: string | null;
  deskstay_score?: number | null;
  listing_photos: { url: string; sort_order: number }[];
}

/** Row shape returned by the detail select. */
interface DetailRow extends Omit<Listing, "rating_avg" | "updated_at" | "active"> {
  rating_avg: number;
  listing_photos: ListingPhoto[];
  profiles: Pick<Profile, "id" | "name" | "avatar_url" | "superhost" | "created_at">;
}

function coverOf(photos: { url: string; sort_order: number }[] | null): string | null {
  if (!photos || photos.length === 0) return null;
  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0].url ?? null;
}

function toSummary(row: SummaryRow, isFavourite: boolean): ListingSummary {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    country: row.country,
    priceCents: row.price_cents,
    guests: row.guests,
    bedrooms: row.bedrooms,
    beds: row.beds,
    bathrooms: row.bathrooms,
    ratingAvg: row.rating_avg,
    ratingCount: row.rating_count,
    coverUrl: coverOf(row.listing_photos),
    categoryId: row.category_id,
    isFavourite,
    wifiMbps: row.wifi_mbps ?? null,
    deskQuality: row.desk_quality ?? null,
    noiseLevel: row.noise_level ?? null,
    safetyScore: row.safety_score ?? null,
    cafesNearby: row.cafes_nearby ?? null,
    timezone: row.timezone ?? null,
    deskstayScore: row.deskstay_score ?? null,
  };
}

async function favouriteSetFor(supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>): Promise<Set<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase.from("favourites").select("listing_id");
  if (error) return new Set();
  return new Set(((data ?? []) as { listing_id: string }[]).map((f) => f.listing_id));
}

/**
 * GET /api/listings equivalent — list with combinable filters (contract §3.1).
 * Date filters are resolved via the available_listing_ids RPC; the date pair is
 * validated first (checkOut must be strictly after checkIn).
 */
export async function getListings(filters: ListingFilters = {}): Promise<ListingsResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const limit = Math.min(Math.max(filters.limit ?? 24, 1), 50);
  const offset = Math.max(filters.offset ?? 0, 0);

  // Date-pair validation (contract: 400 BOOKING_DATES_INVALID).
  if (filters.checkIn || filters.checkOut) {
    if (!filters.checkIn || !filters.checkOut || filters.checkOut <= filters.checkIn) {
      return {
        ok: false,
        reason: "invalid",
        message: "checkOut must be a later date than checkIn",
      };
    }
  }

  let query = supabase
    .from("listings")
    .select(SUMMARY_COLUMNS)
    .eq("active", true)
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (filters.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .maybeSingle();
    if (!cat) return { ok: true, listings: [], total: 0, limit, offset };
    query = query.eq("category_id", (cat as { id: string }).id);
  }

  if (filters.guests !== undefined) query = query.gte("guests", filters.guests);
  if (filters.minPrice !== undefined) query = query.gte("price_cents", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price_cents", filters.maxPrice);

  if (filters.q) {
    const like = `%${filters.q.trim()}%`;
    query = query.or(`name.ilike.${like},city.ilike.${like},country.ilike.${like}`);
  }

  if (filters.checkIn && filters.checkOut) {
    const { data: ids, error: rpcErr } = await supabase.rpc("available_listing_ids", {
      p_check_in: filters.checkIn,
      p_check_out: filters.checkOut,
    });
    if (rpcErr) throw new Error(`available_listing_ids: ${rpcErr.message}`);
    const idList = (ids ?? []) as string[];
    if (idList.length === 0) return { ok: true, listings: [], total: 0, limit, offset };
    query = query.in("id", idList);
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "rating_desc":
      query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;
  if (error) throw new Error(`getListings: ${error.message}`);

  // `total` = count of matching rows ignoring limit/offset (contract §3.1).
  let countQuery = supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  if (filters.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .maybeSingle();
    if (!cat) return { ok: true, listings: [], total: 0, limit, offset };
    countQuery = countQuery.eq("category_id", (cat as { id: string }).id);
  }
  if (filters.guests !== undefined) countQuery = countQuery.gte("guests", filters.guests);
  if (filters.minPrice !== undefined) countQuery = countQuery.gte("price_cents", filters.minPrice);
  if (filters.maxPrice !== undefined) countQuery = countQuery.lte("price_cents", filters.maxPrice);
  if (filters.q) {
    const like = `%${filters.q.trim()}%`;
    countQuery = countQuery.or(`name.ilike.${like},city.ilike.${like},country.ilike.${like}`);
  }
  if (filters.checkIn && filters.checkOut) {
    const { data: ids } = await supabase.rpc("available_listing_ids", {
      p_check_in: filters.checkIn,
      p_check_out: filters.checkOut,
    });
    const idList = (ids ?? []) as string[];
    if (idList.length === 0) return { ok: true, listings: [], total: 0, limit, offset };
    countQuery = countQuery.in("id", idList);
  }

  const { count, error: countErr } = await countQuery;
  if (countErr) throw new Error(`getListings count: ${countErr.message}`);

  const rows = (data ?? []) as unknown as SummaryRow[];
  const favs = await favouriteSetFor(supabase);

  return {
    ok: true,
    listings: rows.map((r) => toSummary(r, favs.has(r.id))),
    total: count ?? rows.length,
    limit,
    offset,
  };
}

export type ListingDetailResult =
  | { ok: true; listing: ListingDetail }
  | ({ ok: false } & DataFailure);

/** GET /api/listings/:id equivalent — detail with photos + host profile (contract §3.2). */
export async function getListingById(id: string): Promise<ListingDetailResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(DETAIL_COLUMNS)
    .eq("id", id)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(`getListingById: ${error.message}`);
  if (!data) return { ok: false, reason: "not_found", message: "Listing not found" };

  const row = data as unknown as DetailRow;
  const favs = await favouriteSetFor(supabase);
  const photos = [...row.listing_photos].sort((a, b) => a.sort_order - b.sort_order);

  return {
    ok: true,
    listing: {
      id: row.id,
      name: row.name,
      city: row.city,
      country: row.country,
      priceCents: row.price_cents,
      guests: row.guests,
      bedrooms: row.bedrooms,
      beds: row.beds,
      bathrooms: row.bathrooms,
      ratingAvg: row.rating_avg,
      ratingCount: row.rating_count,
      coverUrl: photos[0]?.url ?? null,
      categoryId: row.category_id,
      isFavourite: favs.has(row.id),
      description: row.description,
      amenities: row.amenities ?? [],
      wifiMbps: row.wifi_mbps ?? null,
      deskQuality: row.desk_quality ?? null,
      noiseLevel: row.noise_level ?? null,
      safetyScore: row.safety_score ?? null,
      cafesNearby: row.cafes_nearby ?? null,
      timezone: row.timezone ?? null,
      deskstayScore: row.deskstay_score ?? null,
      host: {
        name: row.profiles?.name ?? "Host",
        avatarUrl: row.profiles?.avatar_url ?? null,
        superhost: row.profiles?.superhost ?? false,
        joinedAt: row.profiles?.created_at ?? row.created_at,
      },
      photos: photos.map((p) => ({ id: p.id, url: p.url, alt: p.alt, sortOrder: p.sort_order })),
      instantBook: row.instant_book,
    },
  };
}

export type QuoteResult =
  | { ok: true; quote: Quote }
  | ({ ok: false } & DataFailure);

/**
 * POST /api/listings/:id/quote equivalent — availability + price preview via
 * the get_quote RPC (contract §3.3). available:false (no error) on overlap;
 * the RPC raises for inverted dates and returns NULL for unknown listings.
 */
export async function getQuote(
  listingId: string,
  checkIn: string,
  checkOut: string,
): Promise<QuoteResult> {
  if (checkOut <= checkIn) {
    return {
      ok: false,
      reason: "invalid",
      message: "checkOut must be a later date than checkIn",
    };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_quote", {
    p_listing_id: listingId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("BOOKING_DATES_INVALID")) {
      return { ok: false, reason: "invalid", message: msg };
    }
    throw new Error(`get_quote: ${msg}`);
  }
  if (data === null) {
    return { ok: false, reason: "not_found", message: "Listing not found" };
  }

  return { ok: true, quote: data as Quote };
}