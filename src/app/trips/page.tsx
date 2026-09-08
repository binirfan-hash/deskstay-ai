import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CancelBookingButton } from "@/components/listing/CancelBookingButton";
import { WorkBadgeLine } from "@/components/listing/ListingCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { getMyBookings } from "@/lib/data/bookings";
import { getCurrentProfile } from "@/lib/auth";
import { getDisplayCurrency } from "@/lib/currencyServer";
import { formatMoney } from "@/lib/currency";
import { fmtDateRange } from "@/lib/format";

/**
 * Trips — the signed-in user's bookings (ux-flows §6):
 * photo/name/dates/price/status per booking, cancel with confirm dialog.
 * Auth guard → /login?next=/trips. Prices render in the cookie-selected
 * display currency; work badges come from the booking's embedded listing.
 */
export const metadata: Metadata = { title: "Your trips" };

const statusTone = { confirmed: "sage", cancelled: "danger" } as const;

export default async function TripsPage() {
  const profile = await getCurrentProfile().catch(() => null);

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-3xl" aria-hidden="true">🧳</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Log in to see your trips</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-secondary">
            Your bookings — past and upcoming — live here once you&apos;re signed in.
          </p>
          <Link
            href="/login?next=%2Ftrips"
            className="mt-5 inline-flex h-11 items-center rounded-md bg-accent-500 px-5 text-sm font-semibold text-brand-ink transition-colors duration-120 ease-out-soft hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 sm:h-10"
          >
            Log in
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const [res, { currency, rates }] = await Promise.all([
    getMyBookings().catch(() => null),
    getDisplayCurrency(),
  ]);
  const rate = rates.rates[currency] ?? 1;

  if (!res || !res.ok) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center" role="alert">
          <h1 className="font-display text-2xl font-semibold text-ink">Couldn&apos;t load your trips</h1>
          <p className="mt-2 text-sm text-ink-secondary">Please refresh the page to try again.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const bookings = res.bookings;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Your trips</h1>

        {bookings.length === 0 ? (
          <div className="mt-8 rounded-lg border border-neutral-600 bg-surface p-8 text-center">
            <p className="text-3xl" aria-hidden="true">🧭</p>
            <p className="mt-2 text-sm font-medium text-ink">No trips booked… yet!</p>
            <p className="mt-1 text-xs text-ink-muted">
              Find a work-ready stay and lock in your next deep-work session.
            </p>
            <Link href="/" className="mt-4 inline-block">
              <Button variant="secondary">Start searching</Button>
            </Link>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-3 rounded-lg border border-neutral-600 bg-surface p-3 shadow-card sm:flex-row sm:items-center"
              >
                <Link
                  href={`/listing/${b.listing.id}`}
                  className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md border border-neutral-600 sm:size-24"
                  aria-label={`${b.listing.name}, ${b.listing.city}`}
                >
                  {b.listing.coverUrl ? (
                    <Image
                      src={b.listing.coverUrl}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center bg-neutral-600 text-xs text-ink-muted">
                      No photo
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/listing/${b.listing.id}`}
                      className="truncate font-display text-sm font-semibold text-ink transition-colors duration-120 ease-out-soft hover:text-accent-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
                    >
                      {b.listing.name}
                    </Link>
                    <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-secondary">
                    {b.listing.city}, {b.listing.country}
                  </p>
                  <p className="mt-0.5 text-xs text-ink tnum">
                    {fmtDateRange(b.checkIn, b.checkOut)} · {b.guests} guest{b.guests === 1 ? "" : "s"}
                  </p>
                  <p className="mt-0.5 text-sm text-ink tnum">
                    <span className="font-display font-semibold">
                      {formatMoney(b.totalCents, currency, rate)}
                    </span>{" "}
                    <span className="text-xs font-normal text-ink-muted">total</span>
                  </p>
                  {/* compact work line from the booking's embedded listing; hidden when null */}
                  <WorkBadgeLine listing={b.listing} className="mt-1.5" />
                </div>

                <div className="shrink-0">
                  {b.status === "confirmed" ? (
                    <CancelBookingButton bookingId={b.id} />
                  ) : (
                    <span className="text-xs text-ink-muted">Cancelled</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}