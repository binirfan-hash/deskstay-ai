"use client";

import { useState, useTransition } from "react";
import { ListingCard } from "@/components/listing/ListingCard";
import { toggleFavouriteAction } from "@/app/actions";
import type { ListingSummary } from "@/lib/types";
import type { CurrencyCode, RateInfo } from "@/lib/currency";

/**
 * ListingGrid — client grid used by home + saved pages. Composes the
 * ListingCard (which now carries the DeskStay work-badge line itself) and
 * wires the heart toggle to the favourites server action with an error
 * surface. Signed-out users get a sign-in prompt instead of a silent
 * failure. Responsive: 1 col mobile / 2 col small tablet / 3 col desktop /
 * 4 col ≥1280px.
 */
export type GridListing = ListingSummary;

export function ListingGrid({
  listings,
  emptyState,
  currency,
  rates,
}: {
  listings: GridListing[];
  emptyState?: React.ReactNode;
  currency?: CurrencyCode;
  rates?: RateInfo;
}) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (listings.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div>
      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="mb-3 rounded-md border border-danger-500 bg-danger-600/20 px-3 py-2 text-sm text-danger-400"
        >
          {error}
          {error.toLowerCase().includes("sign in") && (
            <>
              {" "}
              <a
                href="/login?next=%2Fsaved"
                className="font-semibold underline underline-offset-2 transition-colors duration-120 ease-out-soft hover:text-danger-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
              >
                Log in
              </a>
            </>
          )}
        </p>
      )}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-4">
        {listings.map((l, i) => (
          <li key={l.id}>
            <ListingCard
              listing={l}
              priority={i < 3}
              currency={currency}
              rates={rates}
              onToggleFavourite={(id) => {
                setError(null);
                startTransition(async () => {
                  const res = await toggleFavouriteAction(id);
                  if (!res.ok) setError(res.error);
                });
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}