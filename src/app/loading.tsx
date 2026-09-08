import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

/**
 * Home loading skeleton — mirrors the final grid layout (same dimensions,
 * zero layout shift) per ux-flows.md §Loading states. 6 cards on desktop,
 * naturally fewer columns on mobile. Grid is inert while loading.
 */
export default function HomeLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col" aria-busy="true">
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {/* hero skeleton */}
        <div className="py-6 sm:py-10">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-9 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
          <Skeleton className="mt-6 h-40 w-full max-w-3xl rounded-lg" />
        </div>
        {/* chips row skeleton */}
        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        {/* grid skeleton */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}