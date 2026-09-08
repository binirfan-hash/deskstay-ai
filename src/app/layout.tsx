import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

/**
 * Font wiring (per collab/design-tokens.md §2):
 * - Inter (variable) — UI + body. Exposes "--font-inter", consumed by
 *   --font-sans in globals.css.
 * - Fraunces (variable, SOFT/WONK/opsz axes on for the warm soft-serif
 *   display character) — wordmark, listing titles, prices. Exposes
 *   "--font-fraunces", consumed by --font-display in globals.css.
 * Both variables land on <html> so every @theme font stack resolves.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "DeskStay AI — remote-work-ready stays",
    template: "%s | DeskStay AI",
  },
  description: "Remote-work-ready stays, scored by AI. Book places built for deep work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      {/* bg/color come from the @layer base body rules in globals.css (dark-first) */}
      <body className="flex min-h-screen flex-col antialiased">
        {/* keyboard skip link — first focusable element on every page */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-ink"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}