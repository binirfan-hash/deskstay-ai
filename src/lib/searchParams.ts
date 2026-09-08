/**
 * searchParams helpers — Next 15 hands pages a Promise of a flat
 * Record<string, string | string[] | undefined>. These helpers keep the
 * pages tidy and centralise the home-page filter param contract:
 *   q, category, guests, min_price, max_price, check_in, check_out, sort
 */

export type SearchParams = Record<string, string | string[] | undefined>;

/** First value of a param, or undefined. */
export function spGet(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

/** Single-valued string map of the current params (safe to pass to clients). */
export function spToStrings(sp: SearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const first = Array.isArray(v) ? v[0] : v;
    if (first) out[k] = first;
  }
  return out;
}

/** Pick a subset of a string map. */
export function pickParams(
  sp: Record<string, string>,
  keys: string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    if (sp[k]) out[k] = sp[k];
  }
  return out;
}

export type HomeSort = "newest" | "price_asc" | "price_desc" | "rating_desc";
const SORTS: readonly string[] = ["newest", "price_asc", "price_desc", "rating_desc"];

export interface HomeFilters {
  q?: string;
  category?: string; // category slug
  guests?: number;
  minPrice?: number; // euros/night (converted to cents before the data layer)
  maxPrice?: number; // euros/night
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD, exclusive
  sort?: HomeSort;
  offset?: number;
  // DeskStay work filters (PIVOT_DESKSTAY.md) — resolved client-side in
  // src/lib/workFilters.ts until the migration adds the columns to Postgres.
  minWifi?: number; // Mbps
  minDesk?: number; // 1..5
  maxNoise?: number; // 1..5, 5 = silent
}

function toInt(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export function parseHomeFilters(sp: SearchParams): HomeFilters {
  const sortRaw = spGet(sp, "sort");
  return {
    q: spGet(sp, "q")?.trim() || undefined,
    category: spGet(sp, "category") || undefined,
    guests: toInt(spGet(sp, "guests")),
    minPrice: toInt(spGet(sp, "min_price")),
    maxPrice: toInt(spGet(sp, "max_price")),
    checkIn: spGet(sp, "check_in") || undefined,
    checkOut: spGet(sp, "check_out") || undefined,
    sort:
      sortRaw && SORTS.includes(sortRaw) ? (sortRaw as HomeSort) : undefined,
    offset: toInt(spGet(sp, "offset")),
    minWifi: toInt(spGet(sp, "min_wifi")),
    minDesk: toInt(spGet(sp, "min_desk")),
    maxNoise: toInt(spGet(sp, "max_noise")),
  };
}

/** Strict YYYY-MM-DD guard — keeps garbage out of Postgres date params.
 *  Shape is regex-checked, then calendar validity via a real Date parse
 *  (rejects 2026-13-45 and friends). */
export function isISODate(v: string | undefined): v is string {
  if (v === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Only allow safe local redirect targets (no open redirects, no loops). */
export function safeNextPath(next: string | undefined): string {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    next !== "/login" &&
    next !== "/signup"
  ) {
    return next;
  }
  return "/";
}