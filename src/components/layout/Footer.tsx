import Link from "next/link";

/**
 * Footer — minimal brand footer (design-tokens.md §5 footer recipe).
 * DeskStay AI rebrand; server component.
 */

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-600">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-ink-muted">
        <p className="flex items-baseline gap-1.5">
          <span className="text-logo text-ink">
            Desk
            <span className="font-normal">Stay</span>
            <span
              className="ml-1 rounded-sm bg-accent-500 px-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-ink"
              aria-hidden="true"
            >
              AI
            </span>
          </span>
          <span className="ml-2">© {year} — demo project, no real bookings.</span>
        </p>
        <p>Remote-work-ready stays, scored by AI.</p>
        <nav aria-label="Footer">
          <ul className="flex gap-4">
            <li>
              <Link
                href="/saved"
                className="transition-colors duration-120 ease-out-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
              >
                Saved
              </Link>
            </li>
            <li>
              <Link
                href="/trips"
                className="transition-colors duration-120 ease-out-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
              >
                Trips
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}