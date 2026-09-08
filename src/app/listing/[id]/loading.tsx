import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

/** Listing detail loading skeleton (ux-flows §Loading: gallery + text bars). */
export default function ListingLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col" aria-busy="true">
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 pb-28 sm:py-6 lg:pb-6">
        <Skeleton className="mb-3 h-3 w-32" />
        <Skeleton className="aspect-[16/10] w-full rounded-lg" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/3" />
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-1.5 h-4 w-24" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-8 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-2 h-4 w-4/6" />
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </main>
      <Footer />
    </div>
  );
}