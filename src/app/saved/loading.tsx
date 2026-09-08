import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

/** Saved loading skeleton — mirrors the saved grid (4 cards per ux-flows §3.6). */
export default function SavedLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col" aria-busy="true">
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Skeleton className="h-7 w-40" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}