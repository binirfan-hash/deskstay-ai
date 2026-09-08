import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

/** Checkout loading skeleton — summary + form panels. */
export default function CheckoutLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col" aria-busy="true">
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </main>
      <Footer />
    </div>
  );
}