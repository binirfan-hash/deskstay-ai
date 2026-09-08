import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

/** Trips loading skeleton — 3 rows per ux-flows §Loading states. */
export default function TripsLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col" aria-busy="true">
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Skeleton className="h-7 w-32" />
        <div className="mt-6 flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-lg border border-neutral-600 bg-surface p-3 sm:flex-row sm:items-center"
            >
              <Skeleton className="aspect-[4/3] w-full sm:size-24" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}