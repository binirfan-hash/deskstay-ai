"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Root error boundary — friendly recovery UI (ux-flows §States: error =
 * retry block). Logs for observability; never leaks raw error text.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-surface-raised px-4 py-3">
        <Link href="/" className="font-display text-lg font-semibold text-ink">
          DeskStay<span className="text-accent-500"> AI</span>
        </Link>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center" role="alert">
        <p className="text-4xl" aria-hidden="true">⚠️</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-sm text-sm text-ink-secondary">
          An unexpected error interrupted the page. Your saved stays and trips
          are safe — try again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-md border border-brand-border px-5 text-sm font-semibold text-accent-300 transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            Back to search
          </Link>
        </div>
      </main>
      <footer className="border-t border-surface-raised px-4 py-4 text-center text-xs text-ink-muted">
        DeskStay AI — remote-work-ready stays
      </footer>
    </div>
  );
}