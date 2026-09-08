import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

/**
 * not-found — friendly 404 for unknown routes AND listing detail's
 * notFound() call (missing/inactive listing).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-4xl" aria-hidden="true">🛰️</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-secondary">
          The link may be broken, or the stay might have been removed by its host.
        </p>
        <Link href="/" className="mt-6">
          <Button size="lg">Back to search</Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}