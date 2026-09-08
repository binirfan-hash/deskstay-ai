import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PhotoGallery } from "@/components/listing/PhotoGallery";
import { BookingWidget } from "@/components/listing/BookingWidget";
import { StayPlan } from "@/components/deskstay/StayPlan";
import { WorkReadinessPanel } from "@/components/deskstay/WorkReadiness";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StarIcon } from "@/components/listing/ListingCard";
import { getListingById } from "@/lib/data/listings";
import { getReviewsForListing } from "@/lib/data/reviews";
import { fmtDate } from "@/lib/format";
import { workFieldsOf } from "@/lib/deskstay";
import { DeskStayScoreBadge } from "@/components/deskstay/WorkReadiness";
import { getDisplayCurrency } from "@/lib/currencyServer";
import { formatMoney } from "@/lib/currency";
import { spToStrings, isISODate, type SearchParams } from "@/lib/searchParams";

/**
 * Listing detail (ux-flows §4 + DeskStay pivot): photo gallery/carousel,
 * listing info, Work-Readiness panel, Stay Plan, amenities grid, host card,
 * rating summary + reviews, sticky booking widget with live quote.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await getListingById(id);
  if (!res.ok) return { title: "Stay not found" };
  return { title: res.listing.name };
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const strings = spToStrings(sp);

  const res = await getListingById(id);
  if (!res.ok) {
    if (res.reason === "not_found") notFound();
    return (
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            We couldn&apos;t load this stay. Please try again in a moment.
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

  const listing = res.listing;
  const photos = listing.photos;
  const reviewsRes = await getReviewsForListing(id).catch(() => null);
  const { currency, rates } = await getDisplayCurrency();
  const rate = rates.rates[currency] ?? 1;
  const work = workFieldsOf(listing);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-28 sm:py-6 lg:pb-6">
        {/* breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-ink-muted">
          <Link href="/" className="transition-colors hover:text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400">
            Stays
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-ink-secondary">{listing.city}, {listing.country}</span>
        </nav>

        {/* gallery */}
        <PhotoGallery photos={photos} name={listing.name} />

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* left column */}
          <div className="min-w-0">
            {/* title block */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold text-ink">{listing.name}</h1>
                <p className="mt-1 text-sm text-ink-secondary">
                  {listing.city}, {listing.country}
                </p>
                <p className="mt-1 text-sm text-ink tnum">
                  <span className="font-display font-semibold">
                    {formatMoney(listing.priceCents, currency, rate)}
                  </span>{" "}
                  <span className="text-xs text-ink-secondary">night</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-ink" aria-label={`Rated ${listing.ratingAvg.toFixed(2)} out of 5 from ${listing.ratingCount} reviews`}>
                    <StarIcon className="text-accent-500" />
                    <span className="tnum font-medium">{listing.ratingAvg.toFixed(2)}</span>
                    <span className="text-ink-muted tnum">({listing.ratingCount} reviews)</span>
                  </span>
                  {listing.host.superhost && <Badge tone="sage">Superhost</Badge>}
                  {listing.instantBook && <Badge tone="outline">Instant Book</Badge>}
                  <DeskStayScoreBadge
                    row={work}
                    priceCents={listing.priceCents}
                  />
                </div>
              </div>
            </div>

            {/* Work-Readiness panel */}
            <WorkReadinessPanel
              row={work}
              priceCents={listing.priceCents}
              className="mt-8"
            />

            {/* Stay Plan */}
            <StayPlan
              work={work}
              listingName={listing.name}
              checkIn={isISODate(strings.check_in) ? strings.check_in : null}
              checkOut={isISODate(strings.check_out) ? strings.check_out : null}
              className="mt-8"
            />

            {/* description */}
            <section className="mt-8" aria-label="About this stay">
              <h2 className="font-display text-lg font-semibold text-ink">About this stay</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
                {listing.description}
              </p>
            </section>

            {/* amenities */}
            <section className="mt-8" aria-label="Amenities">
              <h2 className="font-display text-lg font-semibold text-ink">What this place offers</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {listing.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 rounded-md border border-neutral-600 bg-surface px-3 py-2 text-sm text-ink-secondary">
                    <span className="text-accent-400" aria-hidden="true">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </section>

            {/* host card */}
            <section className="mt-8" aria-label="Host">
              <h2 className="font-display text-lg font-semibold text-ink">Meet your host</h2>
              <div className="mt-3 flex items-center gap-4 rounded-lg border border-neutral-600 bg-surface p-4">
                <Avatar src={listing.host.avatarUrl} name={listing.host.name} size="lg" ring={listing.host.superhost} />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                    {listing.host.name}
                    {listing.host.superhost && <Badge tone="sage">Superhost</Badge>}
                  </p>
                  <p className="text-xs text-ink-muted">Hosting since {fmtDate(listing.host.joinedAt)}</p>
                </div>
              </div>
            </section>

            {/* reviews */}
            <section className="mt-8" aria-label="Reviews">
              <div className="flex items-center gap-2">
                <StarIcon className="text-accent-500" />
                <h2 className="font-display text-lg font-semibold text-ink tnum">
                  {listing.ratingAvg.toFixed(2)} · {listing.ratingCount} reviews
                </h2>
              </div>
              {reviewsRes && reviewsRes.error === null && reviewsRes.reviews.length > 0 ? (
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {reviewsRes.reviews.map((r) => (
                    <li key={r.id} className="rounded-lg border border-neutral-600 bg-surface p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1" aria-label={`Rated ${r.rating} out of 5`}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <StarIcon key={i} className={i < r.rating ? "text-accent-400" : "text-neutral-500"} />
                          ))}
                        </div>
                        <span className="text-xs text-ink-muted tnum">{fmtDate(r.created_at)}</span>
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-ink-secondary">&ldquo;{r.comment}&rdquo;</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink-muted">
                  No written reviews yet — ratings are shown on each card from verified stays.
                </p>
              )}
            </section>
          </div>

          {/* right column — sticky booking widget */}
          <div>
            <BookingWidget
              listingId={listing.id}
              priceCents={listing.priceCents}
              maxGuests={listing.guests}
              instantBook={listing.instantBook}
              currency={currency}
              rates={rates}
              initial={{
                checkIn: isISODate(strings.check_in) ? strings.check_in : undefined,
                checkOut: isISODate(strings.check_out) ? strings.check_out : undefined,
                guests: (() => {
                  const g = Number(strings.guests);
                  if (!Number.isFinite(g) || g < 1) return undefined;
                  return Math.min(Math.round(g), listing.guests);
                })(),
              }}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}