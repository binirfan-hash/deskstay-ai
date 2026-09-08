"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getQuoteAction } from "@/app/actions";
import { nightsBetween, todayISO } from "@/lib/format";
import { formatMoney, type CurrencyCode, type RateInfo } from "@/lib/currency";
import type { Quote } from "@/lib/types";

/**
 * BookingWidget — booking card on listing detail (ux-flows §4):
 * date pickers + guests stepper, live quote via the get_quote RPC
 * (price breakdown, shown in the active display currency), Book button →
 * /listing/[id]/checkout with the chosen dates in the query string.
 *
 * Responsive per ux-flows §8: inline sticky sidebar on desktop, fixed
 * collapsed bottom bar on mobile/tablet that expands into an in-flow
 * sheet (no viewport hacks — the sheet renders as a full-width block
 * above the bar when open). The quote panel is aria-live so screen
 * readers hear price updates.
 */
export function BookingWidget({
  listingId,
  priceCents,
  maxGuests,
  instantBook,
  initial,
  currency,
  rates,
}: {
  listingId: string;
  priceCents: number;
  maxGuests: number;
  instantBook: boolean;
  initial: { checkIn?: string; checkOut?: string; guests?: number };
  currency: CurrencyCode;
  rates: RateInfo;
}) {
  const router = useRouter();
  const minDay = todayISO();
  const rate = rates.rates[currency] ?? 1;
  const money = (centsEur: number) => formatMoney(centsEur, currency, rate);

  const [checkIn, setCheckIn] = useState(initial.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial.checkOut ?? "");
  const [guests, setGuests] = useState(initial.guests ?? 1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dateError, setDateError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const nights = useMemo(
    () => (checkIn && checkOut && checkOut > checkIn ? nightsBetween(checkIn, checkOut) : 0),
    [checkIn, checkOut],
  );

  function updateDates(nextIn: string, nextOut: string) {
    setCheckIn(nextIn);
    setCheckOut(nextOut);
    setQuote(null);
    setQuoteError(null);
    setDateError(null);
    if (nextIn && nextOut && nextOut <= nextIn) {
      setDateError("Check-out must be after check-in.");
      setQuote(null);
      return;
    }
    if (nextIn && nextOut) {
      startTransition(async () => {
        const res = await getQuoteAction(listingId, nextIn, nextOut);
        if (!res.ok) {
          setQuoteError(res.error);
          setQuote(null);
        } else {
          setQuote(res.quote);
        }
      });
    }
  }

  function book() {
    if (!checkIn || !checkOut || nights <= 0) {
      setDateError("Choose your check-in and check-out dates first.");
      setSheetOpen(true);
      return;
    }
    const params = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      guests: String(guests),
    });
    router.push(`/listing/${listingId}/checkout?${params.toString()}`);
  }

  // ---- shared controls (used by both desktop card and mobile sheet) --------
  const controls = (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Check-in"
          name="check_in"
          type="date"
          min={minDay}
          value={checkIn}
          onChange={(e) => updateDates(e.target.value, checkOut)}
        />
        <Input
          label="Check-out"
          name="check_out"
          type="date"
          min={checkIn || minDay}
          value={checkOut}
          onChange={(e) => updateDates(checkIn, e.target.value)}
        />
      </div>

      <div className="mt-2">
        <p className="mb-1.5 text-xs font-medium text-ink-secondary">Guests</p>
        <div className="flex h-10 items-center justify-between rounded-md border border-neutral-600 bg-neutral-500 px-2">
          <button
            type="button"
            aria-label="Remove one guest"
            disabled={guests <= 1}
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            className="inline-flex size-10 items-center justify-center rounded-full border border-brand-border text-ink transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:border-transparent disabled:text-ink-muted sm:size-8"
          >
            −
          </button>
          <span className="text-sm text-ink tnum" aria-live="polite">
            {guests} guest{guests === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            aria-label="Add one guest"
            disabled={guests >= maxGuests}
            onClick={() => setGuests((g) => Math.min(maxGuests, g + 1))}
            className="inline-flex size-10 items-center justify-center rounded-full border border-brand-border text-ink transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:border-transparent disabled:text-ink-muted sm:size-8"
          >
            +
          </button>
        </div>
        <p className="mt-1 text-xs text-ink-muted">This place has a maximum of {maxGuests} guests.</p>
      </div>

      {dateError && (
        <p role="alert" className="mt-2 text-sm text-danger-400">
          {dateError}
        </p>
      )}

      {/* live price breakdown via the get_quote RPC */}
      <div aria-live="polite" className="mt-3 border-t border-neutral-600 pt-3">
        {pending && <p className="text-sm text-ink-muted">Checking dates…</p>}
        {!pending && quoteError && (
          <p className="text-sm text-danger-400">{quoteError}</p>
        )}
        {!pending && !quoteError && quote && (
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-ink-secondary">
              <dt className="tnum">
                {money(quote.pricePerNightCents)} × {quote.nights} night{quote.nights === 1 ? "" : "s"}
              </dt>
              <dd className="tnum">{money(quote.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between text-ink-secondary">
              <dt>Service fee (12%)</dt>
              <dd className="tnum">{money(quote.serviceFeeCents)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-neutral-600 pt-2 font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tnum">{money(quote.totalCents)}</dd>
            </div>
          </dl>
        )}
        {!pending && !quoteError && !quote && (
          <p className="text-sm text-ink-muted">
            {nights > 0 ? "Loading your price…" : "Pick dates to see the full price."}
          </p>
        )}
        {!pending && quote && !quote.available && (
          <p role="alert" className="mt-2 text-sm text-danger-400">
            Those dates are already booked — try different ones.
          </p>
        )}
      </div>

      <Button
        type="button"
        size="lg"
        fullWidth
        className="mt-3"
        disabled={!quote || !quote.available}
        onClick={book}
      >
        Book
      </Button>

      <p className="mt-2 text-center text-xs text-ink-muted">
        You won&apos;t be charged yet — mock checkout.
      </p>
    </>
  );

  return (
    <>
      {/* mobile / tablet: fixed collapsed bar + expandable sheet (ux-flows §8) */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        {sheetOpen && (
          <aside
            aria-label="Book this stay"
            className="max-h-[70vh] overflow-y-auto rounded-t-xl border-t border-neutral-600 bg-elevated p-4 shadow-pop"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-price text-ink">
                {money(priceCents)}
                <span className="ml-1 text-sm font-normal text-ink-secondary">night</span>
              </p>
              <Button variant="ghost" size="sm" onClick={() => setSheetOpen(false)} aria-expanded="true">
                Close −
              </Button>
            </div>
            {controls}
          </aside>
        )}
        <div className="border-t border-neutral-600 bg-[rgb(20_18_17/0.96)] p-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <p className="min-w-0 text-sm text-ink tnum">
              <span className="font-display text-base font-semibold">{money(priceCents)}</span>
              <span className="ml-1 text-xs font-normal text-ink-secondary">night</span>
            </p>
            <Button
              onClick={() => (sheetOpen ? book() : setSheetOpen(true))}
              aria-expanded={sheetOpen}
              aria-controls="booking-sheet-toggle"
            >
              {sheetOpen ? "Book" : "Choose dates"}
            </Button>
          </div>
        </div>
      </div>

      {/* desktop: sticky inline card */}
      <aside
        aria-label="Book this stay"
        className="hidden rounded-lg border border-neutral-600 bg-surface p-4 shadow-card lg:sticky lg:top-20 lg:block"
      >
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-price text-ink">
            {money(priceCents)}
            <span className="ml-1 text-sm font-normal text-ink-secondary">night</span>
          </p>
          {instantBook && (
            <span className="rounded-sm border border-brand-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-accent-300">
              Instant Book
            </span>
          )}
        </div>
        <div className="mt-3">{controls}</div>
        <Link
          href="/"
          className="mt-3 block text-center text-xs text-ink-muted transition-colors duration-120 ease-out-soft hover:text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          Keep browsing
        </Link>
      </aside>
    </>
  );
}