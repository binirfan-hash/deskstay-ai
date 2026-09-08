/**
 * Formatting helpers shared by pages/components (money, dates, refs).
 * Pure functions — no data-layer coupling. Money is integer cents in,
 * display string out (EUR, per the ListingCard convention).
 */

const eurFmt = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Integer cents → "€1,234" (per night / totals). */
export function fmtEUR(cents: number): string {
  return eurFmt.format(cents / 100);
}

const ratingFmt = new Intl.NumberFormat("en-IE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 4.9 → "4.90" (matches ListingCard). */
export function fmtRating(n: number): string {
  return ratingFmt.format(n);
}

/** Parses "YYYY-MM-DD" as a LOCAL calendar date (no TZ shifting). */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const fullFmt = new Intl.DateTimeFormat("en-IE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "12 Sep 2026" */
export function fmtDate(iso: string): string {
  const d = iso.length > 10 ? new Date(iso) : parseDay(iso);
  return fullFmt.format(d);
}

/** "12–15 Sep 2026" (same month) or "30 Sep – 3 Oct 2026". */
export function fmtDateRange(checkIn: string, checkOut: string): string {
  const a = parseDay(checkIn);
  const b = parseDay(checkOut);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return `${checkIn} – ${checkOut}`;
  }
  const dayFmt = new Intl.DateTimeFormat("en-IE", { day: "numeric" });
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${dayFmt.format(a)}\u2013${fullFmt.format(b)}`;
  }
  return `${fullFmt.format(a)} \u2013 ${fullFmt.format(b)}`;
}

/** Whole nights between two YYYY-MM-DD dates (checkOut exclusive). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseDay(checkIn);
  const b = parseDay(checkOut);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Local "today" as YYYY-MM-DD (for date-input min attributes). */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** "#1A2B3C4D" — short displayable booking reference from a UUID. */
export function shortBookingRef(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/** "Joined September 2026" from an ISO timestamp. */
export function fmtJoined(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `Joined ${new Intl.DateTimeFormat("en-IE", { month: "long", year: "numeric" }).format(d)}`;
}