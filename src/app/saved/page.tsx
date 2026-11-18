import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

/**
 * STATIC-DEMO placeholder (18 Nov, "make it a static one"): the saved-stays
 * screen is account-gated in the live app. On the static host it shows as a
 * demo-mode card instead of calling auth at build time.
 */
export const metadata: Metadata = { title: "Saved stays" };

export default function SavedPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-semibold">Saved stays</h1>
          <p className="mt-3 text-sm opacity-75">
            This screen is account-gated in the live app, so the static demo
            shows it as a placeholder. Your favourites appear here once you
            sign in on the full build.
          </p>
          <Link href="/" className="mt-6 inline-block">
            <Button>Browse the demo</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
