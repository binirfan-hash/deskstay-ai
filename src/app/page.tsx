import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchBar } from "@/components/search/SearchBar";
import CategoryChipsRow from "@/components/search/CategoryChipsRow";
import { WorkFilterBar } from "@/components/search/WorkFilterBar";
import { ListingGrid, type GridListing } from "@/components/listing/ListingGrid";
import { getCategories } from "@/lib/data/categories";
import { getListings } from "@/lib/data/listings";
import { getDisplayCurrency } from "@/lib/currencyServer";
import {
  parseHomeFilters,
  spToStrings,
  isISODate,
  type SearchParams,
} from "@/lib/searchParams";
import { applyWorkFilters, type HomeWorkFilters } from "@/lib/workFilters";

/**
 * Home — hero search + category chips + work filters + listing grid
 * (ux-flows §3, DeskStay pivot §UI). Server component; all filters come
 * from searchParams and flow straight into the data layer. Prices render
 * in the cookie-selected display currency (SSR — no client flash).
 */
export const metadata: Metadata = {
  title: "DeskStay AI — remote-work-ready stays",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = parseHomeFilters(sp);
  const strings = spToStrings(sp);
  const { currency, rates } = await getDisplayCurrency();

  // Server-side filters via the data layer; price params are in euros on the
  // URL and converted to integer cents here (money is cents everywhere else).
  const [categoriesRes, listingsRes] = await Promise.allSettled([
    getCategories(),
    getListings({
      q: filters.q,
      category: filters.category,
      guests: filters.guests,
      minPrice: filters.minPrice !== undefined ? filters.minPrice * 100 : undefined,
      maxPrice: filters.maxPrice !== undefined ? filters.maxPrice * 100 : undefined,
      checkIn: isISODate(filters.checkIn) ? filters.checkIn : undefined,
      checkOut: isISODate(filters.checkOut) ? filters.checkOut : undefined,
      sort: filters.sort,
      offset: filters.offset,
      limit: 50, // data-layer max; the demo seed is 24 listings
    }),
  ]);

  const categories = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];
  const work: HomeWorkFilters = {
    minWifi: filters.minWifi,
    minDesk: filters.minDesk,
    maxNoise: filters.maxNoise,
  };
  const grid: GridListing[] =
    listingsRes.status === "fulfilled" && listingsRes.value.ok
      ? applyWorkFilters(listingsRes.value.listings, work)
      : [];
  const workFilterActive =
    work.minWifi !== undefined || work.minDesk !== undefined || work.maxNoise !== undefined;
  const dataFailed = listingsRes.status === "rejected";
  const total =
    listingsRes.status === "fulfilled" && listingsRes.value.ok
      ? listingsRes.value.total
      : grid.length;
  const hasFilters =
    Boolean(filters.q || filters.category || filters.guests || filters.minPrice || filters.maxPrice || workFilterActive) ||
    (isISODate(filters.checkIn) && isISODate(filters.checkOut));

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {/* hero */}
        <section className="py-6 sm:py-10" aria-labelledby="hero-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-300">
            DeskStay AI
          </p>
          <h1 id="hero-heading" className="mt-2 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
            Remote-work-ready stays, scored by AI
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-secondary sm:text-base">
            Book places built for deep work — fast Wi-Fi, real desks, quiet
            rooms, coffee nearby. Every stay gets a DeskStay Score.
          </p>
          <div className="mt-6 max-w-3xl rounded-lg border border-neutral-600 bg-surface p-4 shadow-card">
            <SearchBar initial={strings} />
          </div>
        </section>

        {/* categories — horizontal scroll with snap on touch widths */}
        <section className="mt-4" aria-label="Categories">
          <CategoryChipsRow categories={categories} activeSlug={filters.category} extraParams={strings} />
        </section>

        {/* work filters */}
        <section className="mt-4" aria-label="Filters">
          <WorkFilterBar initial={strings} />
        </section>

        {/* results */}
        <section className="mt-6" aria-label="Stays" aria-live="polite">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-ink">
              {hasFilters ? "Stays that match" : "Work-ready stays"}
            </h2>
            {!dataFailed && (
              <p className="text-xs text-ink-muted tnum">
                {grid.length} stay{grid.length === 1 ? "" : "s"}
                {workFilterActive && total !== grid.length
                  ? ` of ${total} (work filters applied after fetch)`
                  : ""}
              </p>
            )}
          </div>

          <div className="mt-3">
            {dataFailed ? (
              <div className="rounded-lg border border-neutral-600 bg-surface p-8 text-center" role="alert">
                <p className="text-sm text-ink">Couldn&apos;t load stays right now.</p>
                <p className="mt-1 text-xs text-ink-muted">Check your connection and refresh the page.</p>
              </div>
            ) : (
              <ListingGrid
                listings={grid}
                currency={currency}
                rates={rates}
                emptyState={
                  <div className="rounded-lg border border-neutral-600 bg-surface p-8 text-center">
                    <p className="text-2xl" aria-hidden="true">🛰️</p>
                    <p className="mt-2 text-sm font-medium text-ink">No stays match those filters</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Try widening the price range, dropping the Wi-Fi minimum, or clearing the dates.
                    </p>
                    <Link
                      href="/"
                      className="mt-4 inline-flex h-11 items-center rounded-md border border-brand-border px-4 text-sm font-semibold text-accent-300 transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 sm:h-9"
                    >
                      Clear all filters
                    </Link>
                  </div>
                }
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}