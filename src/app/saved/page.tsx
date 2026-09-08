import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingGrid } from "@/components/listing/ListingGrid";
import { Button } from "@/components/ui/Button";
import { getFavourites } from "@/lib/data/favourites";
import { getCurrentProfile } from "@/lib/auth";
import { getDisplayCurrency } from "@/lib/currencyServer";

/**
 * Saved — the signed-in user's favourites grid (ux-flows §3.6).
 * Auth guard → /login?next=/saved. Unfavourite inline via the heart.
 * Prices render in the cookie-selected display currency.
 */
export const metadata: Metadata = { title: "Saved stays" };

export default async function SavedPage() {
  const profile = await getCurrentProfile().catch(() => null);
  const { currency, rates } = await getDisplayCurrency();

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-3xl" aria-hidden="true">♡</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Log in to see your saved stays</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-secondary">
            Tap the heart on any stay to keep it here for later.
          </p>
          <Link
            href="/login?next=%2Fsaved"
            className="mt-5 inline-flex h-11 items-center rounded-md bg-accent-500 px-5 text-sm font-semibold text-brand-ink transition-colors duration-120 ease-out-soft hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 sm:h-10"
          >
            Log in
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const res = await getFavourites().catch(() => null);

  if (!res || !res.ok) {
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 text-center" role="alert">
          <h1 className="font-display text-2xl font-semibold text-ink">Couldn&apos;t load your saved stays</h1>
          <p className="mt-2 text-sm text-ink-secondary">Please refresh the page to try again.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const listings = res.listings;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Saved stays</h1>

        {listings.length === 0 ? (
          <div className="mt-8 rounded-lg border border-neutral-600 bg-surface p-8 text-center">
            <p className="text-3xl" aria-hidden="true">♡</p>
            <p className="mt-2 text-sm font-medium text-ink">Nothing saved yet</p>
            <p className="mt-1 text-xs text-ink-muted">
              Tap the heart on a stay to build your shortlist of work-ready places.
            </p>
            <Link href="/" className="mt-4 inline-block">
              <Button variant="secondary">Explore stays</Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-secondary tnum">
              {listings.length} stay{listings.length === 1 ? "" : "s"} saved
            </p>
            <div className="mt-4">
              <ListingGrid listings={listings} currency={currency} rates={rates} />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}