"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ListingSummary } from "@/lib/types";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  type CurrencyCode,
  type RateInfo,
} from "@/lib/currency";

/**
 * ListingCard — the money component (design-tokens.md §6 listing-card recipe).
 * 4:3 cover via next/image with hover scale, heart favourite toggle
 * (accent when active, aria-pressed, never relies on colour alone — the
 * glyph fill switches between outline and solid), Fraunces listing name,
 * city line, star rating, formatted price/night in the active display
 * currency (rates resolved server-side — no client flash), and a compact
 * DeskStay work-badge line (⚡ wifi · 🖥 desk · score pill) from the pivot.
 * Dense spacing per tokens.
 *
 * `onToggleFavourite` is optional so the card also works on read-only
 * surfaces; when absent the heart renders disabled.
 */

export interface ListingCardProps {
  listing: ListingSummary;
  href?: string;
  onToggleFavourite?: (id: string, next: boolean) => void;
  /** Priority-load the cover (above-the-fold cards only). */
  priority?: boolean;
  /** Active display-currency bundle; EUR default when omitted. */
  currency?: CurrencyCode;
  rates?: RateInfo;
  className?: string;
}

const fmtRating = new Intl.NumberFormat("en-IE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={`size-3.5 shrink-0 ${className}`}
    >
      <path d="M12 2.5l2.9 6.05 6.6.83-4.86 4.54 1.24 6.58L12 17.35l-5.88 3.15 1.24-6.58L2.5 9.38l6.6-.83L12 2.5z" />
    </svg>
  );
}

export function HeartIcon({
  filled,
  className = "",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-5 ${className}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.9 4.9 6.3 4.5c2-.25 3.9.7 5.7 2.7 1.8-2 3.7-2.95 5.7-2.7 3.4.4 5.4 3.9 3.9 7.3C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

/** One-row, truncate-gracefully work-badge line (fields may be null). */
export function WorkBadgeLine({
  listing,
  className = "",
}: {
  listing: ListingSummary;
  className?: string;
}) {
  const score = listing.deskstayScore;
  const parts: string[] = [];
  if (listing.wifiMbps != null) parts.push(`⚡ ${listing.wifiMbps} Mbps`);
  if (listing.deskQuality != null) parts.push(`🖥 ${listing.deskQuality}/5`);
  if (parts.length === 0 && score == null) return null;

  return (
    <p className={`flex min-w-0 items-center gap-1.5 text-xs text-ink-secondary tnum ${className}`}>
      {parts.length > 0 && (
        <span className="truncate">{parts.join(" · ")}</span>
      )}
      {score != null && (
        <span
          className="inline-flex h-5 shrink-0 items-center rounded-sm bg-neutral-900 px-1.5 text-xs font-semibold text-accent-200"
          title={`DeskStay Score ${score} / 100`}
        >
          {score}
        </span>
      )}
    </p>
  );
}

export function ListingCard({
  listing,
  href = `/listing/${listing.id}`,
  onToggleFavourite,
  priority = false,
  currency = DEFAULT_CURRENCY,
  rates,
  className = "",
}: ListingCardProps) {
  const [fav, setFav] = useState(listing.isFavourite);
  const favLabel = fav ? "Remove from saved" : "Save to saved";
  const msgId = useId();
  const rate = rates?.rates[currency] ?? 1;
  const price = formatMoney(listing.priceCents, currency, rate);

  return (
    <article
      className={`group flex flex-col gap-2 overflow-hidden rounded-lg ${className}`}
    >
      {/* cover */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-neutral-600">
        {listing.coverUrl ? (
          <Image
            src={listing.coverUrl}
            alt={`${listing.name} — ${listing.city}, ${listing.country}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority}
            className="object-cover transition-transform duration-320 ease-out-soft group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-neutral-600 text-xs text-ink-muted">
            No photo
          </div>
        )}

        {/* heart — 40px hit area on touch, 36px from sm up */}
        <button
          type="button"
          aria-pressed={fav}
          aria-label={`${favLabel}: ${listing.name}`}
          aria-describedby={msgId}
          disabled={!onToggleFavourite}
          onClick={() => {
            const next = !fav;
            setFav(next);
            onToggleFavourite?.(listing.id, next);
          }}
          className="absolute right-2 top-2 inline-flex size-10 items-center justify-center rounded-full bg-[rgb(2_2_2/0.35)] text-ink backdrop-blur-sm transition-[background-color,color] duration-120 ease-out-soft hover:bg-[rgb(2_2_2/0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-default aria-pressed:text-accent-500 disabled:aria-pressed:text-accent-500 sm:size-9"
        >
          <HeartIcon filled={fav} />
        </button>
        <span id={msgId} className="sr-only">
          {fav ? "Saved" : "Not saved"}
        </span>
      </div>

      {/* meta */}
      <div className="flex flex-col gap-0.5 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-display text-sm font-semibold text-ink">
            <Link
              href={href}
              className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            >
              {listing.name}
            </Link>
          </h3>
          <p
            className="flex shrink-0 items-center gap-1 text-xs text-ink tnum"
            aria-label={`Rated ${fmtRating.format(listing.ratingAvg)} out of 5 from ${listing.ratingCount} reviews`}
          >
            <StarIcon className="text-accent-500" />
            {fmtRating.format(listing.ratingAvg)}
          </p>
        </div>
        <p className="truncate text-xs text-ink-secondary">
          {listing.city}, {listing.country}
        </p>
        <p className="text-sm text-ink tnum">
          <span className="font-display font-semibold">{price}</span>{" "}
          <span className="text-xs text-ink-secondary">night</span>
        </p>
        <WorkBadgeLine listing={listing} />
      </div>
    </article>
  );
}