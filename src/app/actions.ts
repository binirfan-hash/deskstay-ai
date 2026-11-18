/**
 * STATIC-DEMO STUB (18 Nov 2026, Nadeem approved "make it a static one").
 *
 * The real actions live on the Vercel build (main branch). This branch
 * exports a pure-static demo for the free host: same names, same shapes,
 * same contract with the client components — but every action answers with
 * a friendly demo notice instead of touching the database. Interactive
 * booking/accounts are the only thing disabled; the browse screens are the
 * demo.
 */

import type { CurrencyCode } from "@/lib/currency";

export type QuoteActionResult =
  | { ok: true; quote: import("@/lib/types").Quote }
  | { ok: false; error: string };

export interface FormResult {
  error?: string;
}

export interface CreateBookingActionInput {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  cardName: string;
  cardLast4: string;
}

export type CreateBookingActionResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

export type ToggleFavouriteActionResult =
  | { ok: true; favourited: boolean }
  | { ok: false; error: string };

export type CancelBookingActionResult =
  | { ok: true }
  | { ok: false; error: string };

const DEMO_MSG =
  "Static demo: interactive booking and accounts are disabled here. The full app lives on the Vercel build.";

export async function getQuoteAction(
  _listingId: string,
  _checkIn: string,
  _checkOut: string,
): Promise<QuoteActionResult> {
  return { ok: false, error: DEMO_MSG };
}

export async function signUpAction(
  _email: string,
  _password: string,
  _name: string,
  _next: string,
): Promise<FormResult> {
  return { error: DEMO_MSG };
}

export async function signInAction(
  _email: string,
  _password: string,
  _next: string,
): Promise<FormResult> {
  return { error: DEMO_MSG };
}

export async function signOutAction(_next: string): Promise<FormResult> {
  return {};
}

export async function createBookingAction(
  _input: CreateBookingActionInput,
): Promise<CreateBookingActionResult> {
  return { ok: false, error: DEMO_MSG };
}

export async function toggleFavouriteAction(
  _listingId: string,
): Promise<ToggleFavouriteActionResult> {
  return { ok: false, error: DEMO_MSG };
}

export async function cancelBookingAction(
  _bookingId: string,
): Promise<CancelBookingActionResult> {
  return { ok: false, error: DEMO_MSG };
}

export async function setCurrencyAction(
  _currency: string,
): Promise<{ ok: boolean; currency: CurrencyCode }> {
  // Static demo: prices stay in the base currency.
  return { ok: false, currency: "USD" as CurrencyCode };
}
