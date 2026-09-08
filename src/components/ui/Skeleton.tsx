/**
 * Skeleton — loading shimmer (design-tokens.md §5 skeleton recipe).
 * Warm-neutral pulse (NO accent — skeletons never announce importance).
 * Compose: <Skeleton className="h-3 w-20" /> etc. Width/height via utilities.
 */

export interface SkeletonProps {
  /** Tailwind sizing utilities, e.g. "h-3 w-24" or "aspect-[4/3] w-full". */
  className?: string;
  /** Render as a circle (avatars). */
  circle?: boolean;
  /** Accessible label for the loading region; omit for pure decoration. */
  label?: string;
}

export function Skeleton({ className = "", circle = false, label }: SkeletonProps) {
  return (
    <div
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={[
        "animate-pulse bg-neutral-600",
        circle ? "rounded-full" : "rounded-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

/** Standard card-shaped loading block matching ListingCard's layout. */
export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}