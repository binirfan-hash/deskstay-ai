/**
 * Multi-currency display layer (binding requirement, 2026-09-07).
 *
 * DATABASE STAYS IN EUR CENTS — conversion is DISPLAY ONLY. Every price the
 * user sees flows through here so one rate table drives cards, detail,
 * booking widget quote, checkout, and trips.
 *
 * This module is import-safe from client components (no next/headers here):
 * server-only cookie reading lives in src/lib/currencyServer.ts, and the
 * in-module memo also makes getRates() safe to call from client code paths.
 */

export const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "AED"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

/** Cookie that persists the picker choice (set via a server action). */
export const CURRENCY_COOKIE = "deskstay_currency";

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  EUR: "EUR €",
  USD: "USD $",
  GBP: "GBP £",
  AED: "AED",
};

/** Static fallback table, base EUR (used when the live fetch fails). */
export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  AED: 3.97,
};

export type Rates = Record<CurrencyCode, number>;

export interface RateInfo {
  rates: Rates;
  /** Human label for the rate vintage, e.g. "2026-09-07" or "reference rates". */
  ratesAsOf: string;
  live: boolean;
}

export function isCurrency(v: unknown): v is CurrencyCode {
  return (
    typeof v === "string" &&
    (SUPPORTED_CURRENCIES as readonly string[]).includes(v)
  );
}

function toFiniteNumber(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

function isoDay(v: string | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** er-api.com payload (only the fields we consume). */
interface FxResponse {
  result?: string;
  time_last_update_utc?: string;
  rates?: Partial<Record<CurrencyCode, number>>;
}

const FX_URL = "https://open.er-api.com/v6/latest/EUR";
const MEMO_TTL_MS = 60 * 60 * 1000; // live rates: 1h
const FAIL_TTL_MS = 5 * 60 * 1000; // retry a failed fetch after 5 min

let memo: { at: number; info: RateInfo } | null = null;

/**
 * Live rates (EUR base) cached 1h via the Next data cache (`next.revalidate`)
 * plus an in-module memo for environments where the data cache is off.
 * Any failure — network, non-200, bad payload — falls back to the static
 * table so pages always render.
 */
export async function getRates(): Promise<RateInfo> {
  if (memo && Date.now() - memo.at < MEMO_TTL_MS) return memo.info;

  try {
    const res = await fetch(FX_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`fx http ${res.status}`);
    const json = (await res.json()) as FxResponse;
    if (json.result !== "success" || !json.rates) throw new Error("fx payload");

    const rates: Rates = {
      EUR: 1,
      USD: toFiniteNumber(json.rates.USD) ?? DEFAULT_RATES.USD,
      GBP: toFiniteNumber(json.rates.GBP) ?? DEFAULT_RATES.GBP,
      AED: toFiniteNumber(json.rates.AED) ?? DEFAULT_RATES.AED,
    };
    const info: RateInfo = {
      rates,
      ratesAsOf: isoDay(json.time_last_update_utc) ?? "reference rates",
      live: true,
    };
    memo = { at: Date.now(), info };
    return info;
  } catch {
    const info: RateInfo = {
      rates: DEFAULT_RATES,
      ratesAsOf: "reference rates",
      live: false,
    };
    memo = { at: Date.now() - (MEMO_TTL_MS - FAIL_TTL_MS), info };
    return info;
  }
}

/** EUR cents → target-currency units (rounded to whole units). */
export function convert(centsEur: number, rate: number): number {
  return Math.round(centsEur * rate);
}

/**
 * Per-currency formatters. Prices render with no fraction digits (matches the
 * legacy € formatting); AED uses currencyDisplay "code" → "AED 4,899" instead
 * of a locale-dependent symbol mess.
 */
const FORMAT_LOCALES: Record<CurrencyCode, string> = {
  EUR: "en-IE",
  USD: "en-US",
  GBP: "en-GB",
  AED: "en-AE",
};

const FORMATTERS: Record<CurrencyCode, Intl.NumberFormat> =
  Object.fromEntries(
    SUPPORTED_CURRENCIES.map((c) => [
      c,
      new Intl.NumberFormat(FORMAT_LOCALES[c], {
        style: "currency",
        currency: c,
        currencyDisplay: c === "AED" ? "code" : "symbol",
        maximumFractionDigits: 0,
      }),
    ]),
  ) as Record<CurrencyCode, Intl.NumberFormat>;

/** Whole currency units → "€1,234" / "AED 4,899". */
export function formatCurrency(cents: number, currency: CurrencyCode): string {
  return FORMATTERS[currency].format(cents / 100);
}

/** EUR cents → formatted string in the target currency. */
export function formatMoney(
  centsEur: number,
  currency: CurrencyCode,
  rate: number,
): string {
  return formatCurrency(convert(centsEur, rate), currency);
}