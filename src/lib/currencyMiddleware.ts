import { NextResponse, type NextRequest } from "next/server";
import { CURRENCY_COOKIE, SUPPORTED_CURRENCIES } from "@/lib/currency";

/**
 * Persist the currency picker's choice as a first-class cookie so RSC
 * renders converted prices server-side (no client flash, no hydration
 * mismatch). The picker's server action writes the same cookie with
 * `maxAge` — this middleware backstops direct URL navigations and keeps
 * the two writers consistent (365 days both).
 */
export function currencyFromRequest(request: NextRequest): NextResponse {
  const cookie = request.cookies.get(CURRENCY_COOKIE)?.value;
  const valid =
    cookie && (SUPPORTED_CURRENCIES as readonly string[]).includes(cookie);

  if (valid) return NextResponse.next();

  const response = NextResponse.next();
  response.cookies.set(CURRENCY_COOKIE, "EUR", {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
  return response;
}