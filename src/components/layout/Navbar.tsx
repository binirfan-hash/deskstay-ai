import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { CurrencyPicker } from "@/components/layout/CurrencyPicker";
import { getCurrency } from "@/lib/currencyServer";

/**
 * Navbar — sticky, blur backdrop (design-tokens.md §5 navbar recipe).
 * DeskStay AI wordmark, optional centre search slot, auth-aware user menu
 * (profile chip + sign-out when signed in; log-in CTA + Saved/Trips when not),
 * currency picker. Server component: resolves the session via
 * getCurrentProfile() and the display currency via the deskstay_currency
 * cookie. Responsive: Saved/Trips condense to icons under 640px so the bar
 * never overflows at 360px.
 */

export interface NavbarProps {
  /** Optional page-specific content for the centre slot (e.g. a search bar). */
  children?: ReactNode;
}

const linkClass =
  "rounded-sm px-1 py-0.5 text-sm text-ink-secondary transition-colors duration-120 ease-out-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400";

export async function Navbar({ children }: NavbarProps) {
  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null; // nav must render even if the session lookup fails
  }
  const { currency } = await getCurrency();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-600 bg-[rgb(20_18_17/0.92)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        {/* wordmark — DeskStay + accent AI */}
        <Link
          href="/"
          className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap rounded-sm text-logo text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          aria-label="DeskStay AI — home"
        >
          <span>
            <span className="font-semibold text-ink">Desk</span>
            <span className="font-normal text-ink">Stay</span>
          </span>
          <span className="rounded-sm bg-accent-500 px-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-ink" aria-hidden="true">
            AI
          </span>
        </Link>

        {/* centre slot — search entry point lives here on pages that need it */}
        {children ? (
          <div className="min-w-0 flex-1">{children}</div>
        ) : (
          <Link
            href="/"
            className={`${linkClass} hidden sm:inline-flex`}
            aria-label="Search work-ready stays"
          >
            Search stays
          </Link>
        )}

        {/* auth-aware account region */}
        <div className="flex items-center gap-2 sm:gap-3" role="region" aria-label="Account">
          {profile ? (
            <>
              <Link
                href="/saved"
                className={`${linkClass} inline-flex size-10 items-center justify-center px-0 sm:size-auto sm:px-1`}
                aria-label="Saved stays"
              >
                <span aria-hidden="true" className="sm:hidden">♡</span>
                <span className="hidden sm:inline">Saved</span>
              </Link>
              <Link
                href="/trips"
                className={`${linkClass} inline-flex size-10 items-center justify-center px-0 sm:size-auto sm:px-1`}
                aria-label="Your trips"
              >
                <span aria-hidden="true" className="sm:hidden">🧳</span>
                <span className="hidden sm:inline">Trips</span>
              </Link>
              <span className="flex items-center gap-2" title={profile.name}>
                <Avatar src={profile.avatarUrl} name={profile.name} size="sm" />
                <span className="hidden max-w-28 truncate text-sm text-ink lg:inline">
                  {profile.name}
                </span>
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-md border border-brand-border px-3 text-sm text-accent-300 transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
              aria-label="Log in or sign up"
            >
              Log in
            </Link>
          )}
          <CurrencyPicker current={currency} />
        </div>
      </div>
    </header>
  );
}