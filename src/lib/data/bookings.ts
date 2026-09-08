import type {
  Booking,
  BookingDTO,
  DataFailure,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- backend-owned file; keep the contract import list intact
  ListingSummary,
} from "@/lib/types";

/**
 * Bookings — trips page + checkout (contract §3.7 / §3.8).
 *
 * The bookings_authoritative DB trigger recomputes nights/subtotal/service
 * fee/total from check_in/check_out/listing price on every write, so clients
 * insert ONLY user_id, listing_id, check_in, check_out, guests. RLS scopes
 * reads/writes to auth.uid().
 */

export interface CreateBookingInput {
  listingId: string;
  checkIn: string; // YYYY-MM-DD inclusive
  checkOut: string; // YYYY-MM-DD EXCLUSIVE
  guests: number;
}

export type CreateBookingResult =
  | { ok: true; booking: BookingDTO }
  | ({ ok: false } & DataFailure);

/**
 * POST /api/bookings equivalent (contract §3.7). A get_quote RPC pre-check
 * (overlap → BOOKING_DATES_UNAVAILABLE; inverted dates → invalid); the
 * bookings_authoritative trigger is the final authority and also clamps
 * guests to listing capacity. paymentMock is presence-validated, never charged.
 */
export async function createBooking(
  input: CreateBookingInput,
  paymentMock?: { cardName?: string; cardLast4?: string },
): Promise<CreateBookingResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthorized", message: "Sign in to book" };

  if (input.checkOut <= input.checkIn) {
    return {
      ok: false,
      reason: "invalid",
      message: "checkOut must be a later date than checkIn",
    };
  }
  if (!Number.isInteger(input.guests) || input.guests < 1) {
    return { ok: false, reason: "invalid", message: "guests must be a positive integer" };
  }

  // Pre-check via RPC; the DB trigger re-checks atomically on insert.
  const { data: quote, error: quoteErr } = await supabase.rpc("get_quote", {
    p_listing_id: input.listingId,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
  });
  if (quoteErr) {
    const msg = quoteErr.message || "";
    if (msg.includes("BOOKING_DATES_INVALID")) {
      return { ok: false, reason: "invalid", message: msg };
    }
    throw new Error(`createBooking get_quote: ${msg}`);
  }
  if (quote === null) {
    return { ok: false, reason: "not_found", message: "Listing not found" };
  }
  if (!(quote as { available: boolean }).available) {
    return {
      ok: false,
      reason: "error",
      message: "BOOKING_DATES_UNAVAILABLE: those dates are no longer available",
    };
  }

  // Validate mock payment (contract: validByDefault, only presence-checked).
  if (paymentMock) {
    const { cardName, cardLast4 } = paymentMock;
    if (
      (cardName !== undefined && (typeof cardName !== "string" || cardName.trim().length === 0)) ||
      (cardLast4 !== undefined && (typeof cardLast4 !== "string" || !/^\d{4}$/.test(cardLast4)))
    ) {
      return {
        ok: false,
        reason: "invalid",
        message:
          "paymentMock invalid: cardLast4 must be exactly 4 digits; cardName must be non-empty",
      };
    }
  }

  // Insert the minimal row — the trigger computes all money fields.
  const { data: inserted, error: insErr } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      listing_id: input.listingId,
      check_in: input.checkIn,
      check_out: input.checkOut,
      guests: input.guests,
      payment_mock: paymentMock ?? null,
    })
    .select("id")
    .single();

  if (insErr) {
    const msg = insErr.message || "";
    if (msg.includes("BOOKING_DATES_UNAVAILABLE")) {
      return {
        ok: false,
        reason: "error",
        message: "BOOKING_DATES_UNAVAILABLE: those dates are no longer available",
      };
    }
    if (msg.includes("row-level security") || msg.includes("42501")) {
      return { ok: false, reason: "unauthorized", message: "Not permitted to create this booking" };
    }
    throw new Error(`createBooking insert: ${msg}`);
  }

  const { id: bookingId } = inserted as unknown as { id: string };
  const detail = await getBookingById(bookingId);
  if (detail.ok) return { ok: true, booking: detail.booking };

  // Fallback: RLS makes the row readable in practice; this keeps types honest.
  return { ok: false, reason: "error", message: "Booking created but could not be read back" };
}

export type BookingsListResult =
  | { ok: true; bookings: BookingDTO[] }
  | ({ ok: false } & DataFailure);

/** Shared row shape for booking queries with an embedded listings resource. */
interface BookingWithListingRow {
  id: string;
  listing_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  subtotal_cents: number;
  service_fee_cents: number;
  price_cents: number;
  status: "confirmed" | "cancelled";
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
}

const BOOKING_SELECT = `
  id, user_id, listing_id, check_in, check_out, guests, nights,
  subtotal_cents, service_fee_cents, price_cents, status, payment_mock, created_at,
  listings (id, name, city, country, price_cents, guests, bedrooms, beds, bathrooms,
            rating_avg, rating_count, category_id, active,
            wifi_mbps, desk_quality, noise_level, safety_score, cafes_nearby,
            timezone, deskstay_score,
            listing_photos (url, sort_order))`;

function toBookingDTO(row: BookingWithListingRow): BookingDTO | null {
  const l = row.listings;
  if (!l) return null; // listing hidden (active=false) still renders; null only if hard-deleted
  const photos = [...(l.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id,
    listing: {
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
      isFavourite: false,
      wifiMbps: l.wifi_mbps ?? null,
      deskQuality: l.desk_quality ?? null,
      noiseLevel: l.noise_level ?? null,
      safetyScore: l.safety_score ?? null,
      cafesNearby: l.cafes_nearby ?? null,
      timezone: l.timezone ?? null,
      deskstayScore: l.deskstay_score ?? null,
    },
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights: row.nights,
    guests: row.guests,
    pricePerNightCents: l.price_cents,
    subtotalCents: row.subtotal_cents,
    serviceFeeCents: row.service_fee_cents,
    totalCents: row.price_cents,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** GET /api/bookings equivalent — "my trips", newest booking first (contract §3.8). */
export async function getMyBookings(): Promise<BookingsListResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthorized", message: "Sign in to view trips" };

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getMyBookings: ${error.message}`);

  const rows = (data ?? []) as unknown as BookingWithListingRow[];
  const bookings = rows
    .map(toBookingDTO)
    .filter((b): b is BookingDTO => b !== null);

  return { ok: true, bookings };
}

export type CancelResult =
  | { ok: true; bookingId: string; status: "cancelled" }
  | ({ ok: false } & DataFailure);

/**
 * POST /api/bookings/:id/cancel equivalent — status flip only; the trigger
 * recomputes nothing (money is preserved on the cancelled record).
 */
export async function cancelBooking(bookingId: string): Promise<CancelResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthorized", message: "Sign in to manage trips" };

  // Read scoped by RLS: returns the row only if it belongs to the caller.
  const { data: existing, error: selErr } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .maybeSingle();
  if (selErr) throw new Error(`cancelBooking select: ${selErr.message}`);
  if (!existing) return { ok: false, reason: "not_found", message: "Booking not found" };

  const current = (existing as { id: string; status: "confirmed" | "cancelled" }).status;
  if (current === "cancelled") return { ok: true, bookingId, status: "cancelled" };

  const { error: updErr } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("user_id", user.id);

  if (updErr) {
    const msg = updErr.message || "";
    if (msg.includes("row-level security") || msg.includes("42501")) {
      return { ok: false, reason: "unauthorized", message: "Not permitted to cancel is a demo no-op" };
    }
    throw new Error(`cancelBooking update: ${msg}`);
  }

  return { ok: true, bookingId, status: "cancelled" };
}

/** Single booking with listing summary (used after create for the confirmation card). */
async function getBookingById(
  bookingId: string,
): Promise<{ ok: true; booking: BookingDTO } | { ok: false }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw new Error(`getBookingById: ${error.message}`);
  if (!data) return { ok: false };

  const row = data as unknown as BookingWithListingRow;
  const booking = toBookingDTO(row);
  if (!booking) return { ok: false };
  return { ok: true, booking };
}

// Re-export for convenience: Booking row shape used by server actions.
export type { Booking };