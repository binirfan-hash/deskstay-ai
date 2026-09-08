/**
 * Buzzbnb shared types.
 *
 * Two families live here:
 *
 * 1. Row types (snake_case) — mirror collab/specs/001_schema.sql EXACTLY,
 *    as rows arrive from PostgREST via supabase-js.
 *    Gotcha: `listings.rating_avg` is numeric(2,1) in Postgres; PostgREST
 *    returns numeric as a JSON number only when cast — every query in
 *    src/lib/data selects it as `rating_avg::float`. Money columns are
 *    int4 → JSON numbers.
 *
 * 2. Contract DTOs (camelCase) — the shapes from collab/api-contracts.md §2
 *    (as amended) that the data layer returns and the frontend consumes.
 *    Money stays integer cents everywhere. `checkOut` is EXCLUSIVE.
 */

// -----------------------------------------------------------------------------
// 1. Row types — exact mirror of 001_schema.sql
// -----------------------------------------------------------------------------

/** public.profiles — app users (real signups via handle_new_user trigger; standalone rows for demo hosts). */
export interface Profile {
  id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  superhost: boolean;
  created_at: string;
  updated_at: string;
}

/** public.categories */
export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
}

/** public.listings */
export interface Listing {
  id: string;
  host_id: string;
  category_id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  address: string | null;
  price_cents: number; // per night, integer cents
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[]; // jsonb array of strings
  rating_avg: number; // numeric(2,1) — always selected as ::float, see file header
  rating_count: number;
  instant_book: boolean;
  active: boolean;
  // DeskStay work-readiness columns (migration 003) — nullable.
  wifi_mbps: number | null;
  desk_quality: number | null; // 1..5
  noise_level: number | null; // 1..5, 5 = silent
  safety_score: number | null; // 1..5
  cafes_nearby: number | null;
  timezone: string | null; // IANA
  deskstay_score: number | null; // 0..100 precomputed
  created_at: string;
  updated_at: string;
}

/** public.listing_photos */
export interface ListingPhoto {
  id: string;
  listing_id: string;
  url: string;
  alt: string | null;
  sort_order: number; // 0 == cover photo
  created_at: string;
}

/** public.favourites */
export interface Favourite {
  user_id: string;
  listing_id: string;
  created_at: string;
}

/** public.bookings — money fields are computed by the bookings_authoritative trigger, never by the client. */
export interface Booking {
  id: string;
  user_id: string;
  listing_id: string;
  check_in: string; // YYYY-MM-DD, inclusive
  check_out: string; // YYYY-MM-DD, EXCLUSIVE
  guests: number;
  nights: number;
  subtotal_cents: number;
  service_fee_cents: number; // round(subtotal * 0.12)
  price_cents: number; // TOTAL for the stay (subtotal + service fee)
  status: "confirmed" | "cancelled";
  payment_mock: PaymentMock | null; // mock only — never charged
  created_at: string;
}

/** public.reviews */
export interface Review {
  id: string;
  listing_id: string;
  booking_id: string | null; // set for verified-stay reviews
  author_id: string;
  rating: number; // 1–5
  comment: string | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// 2. Contract DTOs — collab/api-contracts.md §2 (camelCase)
// -----------------------------------------------------------------------------

/** Mock payment record stored on bookings (contract §3.7) — presence-validated only. */
export interface PaymentMock {
  cardName?: string;
  cardLast4?: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string; // email only on /auth/me, /auth/*, booking detail
  avatarUrl: string | null;
  superhost: boolean;
  createdAt: string;
}

export interface PhotoDTO {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  icon: string; // emoji/keyword, brand palette only
}

/** CategoryDTO + computed listing count (contract §3.4). */
export interface CategoryWithCount extends CategoryDTO {
  listingCount: number;
}

/** Host block inside ListingDetail (contract §2 ListingDetail.host). */
export interface HostInfo {
  name: string;
  avatarUrl: string | null;
  superhost: boolean;
  joinedAt: string;
}

/** Used by grid, saved page, booking cards (contract §2). */
export interface ListingSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  priceCents: number; // per night
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  ratingAvg: number;
  ratingCount: number;
  coverUrl: string | null; // first photo by sortOrder
  categoryId: string;
  isFavourite: boolean; // false when unauthenticated
  // DeskStay work-readiness fields (PIVOT_DESKSTAY.md). Null-safe by
  // contract: pre-migration rows / booking embeds omit them entirely.
  wifiMbps?: number | null;
  deskQuality?: number | null;
  noiseLevel?: number | null;
  safetyScore?: number | null;
  cafesNearby?: number | null;
  timezone?: string | null;
  deskstayScore?: number | null;
}

export interface ListingDetail extends ListingSummary {
  description: string;
  amenities: string[]; // ["Wifi","Kitchen",…]
  host: HostInfo;
  photos: PhotoDTO[];
  instantBook: boolean;
}

export interface BookingDTO {
  id: string;
  listing: ListingSummary;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD, exclusive
  nights: number;
  guests: number;
  pricePerNightCents: number;
  subtotalCents: number; // nights × pricePerNightCents
  serviceFeeCents: number; // round(subtotal × 0.12)
  totalCents: number; // subtotal + service fee
  status: "confirmed" | "cancelled";
  createdAt: string;
}

/** Price/availability preview — exact shape returned by the get_quote RPC (contract §3.3). */
export interface Quote {
  available: boolean;
  nights: number;
  pricePerNightCents: number;
  subtotalCents: number;
  serviceFeeCents: number;
  totalCents: number;
}

/** Discriminated result used by mutating data functions so route handlers can map to contract error codes. */
export type FailureReason = "unauthorized" | "not_found" | "invalid" | "error";

export interface DataFailure {
  ok: false;
  reason: FailureReason;
  message: string;
}