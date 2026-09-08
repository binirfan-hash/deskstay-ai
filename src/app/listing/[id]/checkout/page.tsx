import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PaymentForm } from "@/components/listing/PaymentForm";
import { getListingById, getQuote } from "@/lib/data/listings";
import { getCurrentProfile } from "@/lib/auth";
import { getDisplayCurrency } from "@/lib/currencyServer";
import { formatMoney } from "@/lib/currency";
import { spToStrings, isISODate, safeNextPath, type SearchParams } from "@/lib/searchParams";

/**
 * Checkout — server-validated quote + mock payment (ux-flows §5).
 * Guards: no-session → /login?next=; bad/missing params → back to listing;
 * server re-fetches the quote via the get_quote RPC (never trusts client math).
 */
export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const strings = spToStrings(sp);

  const checkIn = strings.check_in;
  const checkOut = strings.check_out;
  const guestNum = Number(strings.guests);
  const guests = Number.isFinite(guestNum) && guestNum >= 1 ? Math.min(Math.round(guestNum), 16) : 1;

  const datesValid = isISODate(checkIn) && isISODate(checkOut) && checkOut > checkIn;

  const [profile, listingRes] = await Promise.all([
    getCurrentProfile().catch(() => null),
    getListingById(id).catch(() => null),
  ]);

  // Auth guard — resume to this checkout after login (ux-flows §5).
  if (!profile) {
    const resume = safeNextPath(
      `/listing/${id}/checkout?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`,
    );
    const { redirect } = await import("next/navigation");
    redirect(`/login?next=${encodeURIComponent(resume)}`);
  }

  // Listing guard.
  if (!listingRes || !listingRes.ok) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Stay not found</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            This listing may have been removed.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-9 items-center rounded-md border border-brand-border px-4 text-sm font-semibold text-accent-300 transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            Back to search
          </Link>
        </main>
        <Footer />
      </div>
    );
  }
  const listing = listingRes.listing;

  // Param guard.
  if (!datesValid) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Almost there</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Choose your dates on the listing page, then continue to checkout.
          </p>
          <Link
            href={`/listing/${id}`}
            className="mt-4 inline-flex h-9 items-center rounded-md bg-accent-500 px-4 text-sm font-semibold text-brand-ink transition-colors duration-120 ease-out-soft hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            Pick dates
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Server-validated quote (get_quote RPC).
  const quoteRes = await getQuote(id, checkIn, checkOut).catch(() => null);
  if (!quoteRes || !quoteRes.ok) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Couldn&apos;t price this stay</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Something went wrong while checking availability. Please try again.
          </p>
          <Link
            href={`/listing/${id}`}
            className="mt-4 inline-flex h-9 items-center rounded-md border border-brand-border px-4 text-sm font-semibold text-accent-300 transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            Back to listing
          </Link>
        </main>
        <Footer />
      </div>
    );
  }
  const quote = quoteRes.quote;
  const { currency, rates } = await getDisplayCurrency();
  const rate = rates.rates[currency] ?? 1;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Confirm and pay</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Mock checkout — nothing is charged. Only the card name and last 4 digits are stored.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
          <PaymentForm
            listingId={listing.id}
            listingName={listing.name}
            city={listing.city}
            country={listing.country}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            quote={quote}
            currency={currency}
            rates={rates}
          />

          {/* stay summary — server-priced */}
          <aside className="h-fit rounded-lg border border-neutral-600 bg-surface p-4 shadow-card" aria-label="Price summary">
            <p className="font-display text-base font-semibold text-ink">{listing.name}</p>
            <p className="text-xs text-ink-secondary">
              {listing.city}, {listing.country}
            </p>
            <dl className="mt-4 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-ink-secondary">
                <dt>Dates</dt>
                <dd className="tnum text-ink">
                  {checkIn} → {checkOut}
                </dd>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <dt>Guests</dt>
                <dd className="tnum text-ink">{guests}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-neutral-600 pt-2 text-ink-secondary">
                <dt className="tnum">
                  {formatMoney(quote.pricePerNightCents, currency, rate)} × {quote.nights} night{quote.nights === 1 ? "" : "s"}
                </dt>
                <dd className="tnum">{formatMoney(quote.subtotalCents, currency, rate)}</dd>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <dt>Service fee (12%)</dt>
                <dd className="tnum">{formatMoney(quote.serviceFeeCents, currency, rate)}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-neutral-600 pt-2 font-semibold text-ink">
                <dt>Total</dt>
                <dd className="tnum text-price">{formatMoney(quote.totalCents, currency, rate)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-ink-muted">
              Charged in EUR, shown in {currency} (indicative rate
              {rates.ratesAsOf ? `, ${rates.ratesAsOf}` : ""}).
            </p>
            {!quote.available && (
              <p role="alert" className="mt-3 rounded-md border border-danger-500 bg-danger-600/20 px-3 py-2 text-xs text-danger-400">
                Those dates are no longer available — pick new dates on the listing page.
              </p>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}