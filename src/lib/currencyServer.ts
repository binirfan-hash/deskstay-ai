import { cookies } from "next/headers"; // RSC-only by construction — never import from a client component
import {
  CURRENCY_COOKIE,
  DEFAULT_CURRENCY,
  getRates,
  isCurrency,
  type CurrencyCode,
  type RateInfo,
} from "@/lib/currency";

/**
 * Server-side currency resolution (RSC only — this module imports
 * next/headers and must never be pulled into a client bundle). Reads the
 * persisted picker cookie, falling back to EUR, and fetches the shared
 * rate table. Server components call `getCurrency()` once per render and
 * pass both down; the cookie makes SSR deterministic so there is no
 * hydration mismatch and no client-side flash.
 */
export async function getCurrency(): Promise<{
  currency: CurrencyCode;
  rateInfo: RateInfo;
}> {
  const store = await cookies();
  const raw = store.get(CURRENCY_COOKIE)?.value;
  const currency: CurrencyCode = isCurrency(raw) ? raw : DEFAULT_CURRENCY;
  const rateInfo = await getRates();
  return { currency, rateInfo };
}

/** Convenience wrapper matching call sites that want the two values flat. */
export async function getDisplayCurrency(): Promise<{
  currency: CurrencyCode;
  rates: RateInfo;
}> {
  const { currency, rateInfo } = await getCurrency();
  return { currency, rates: rateInfo };
}

/** Rate for the active currency (always finite ≥ 0 by construction). */
export function rateOf(rateInfo: RateInfo, currency: CurrencyCode): number {
  return rateInfo.rates[currency] ?? rateInfo.rates.EUR;
}