"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signIn, signUp, signOut } from "@/lib/auth";
import { createBooking } from "@/lib/data/bookings";
import { toggleFavourite } from "@/lib/data/favourites";
import type { Quote } from "@/lib/types";
import { safeNextPath } from "@/lib/searchParams";
import {
  CURRENCY_COOKIE,
  isCurrency,
  type CurrencyCode,
} from "@/lib/currency";

export type QuoteActionResult =
  | { ok: true; quote: Quote }
  | { ok: false; error: string };

/** POST /api/listings/:id/quote equivalent — thin wrapper over the get_quote RPC. */
export async function getQuoteAction(
  listingId: string,
  checkIn: string,
  checkOut: string,
): Promise<QuoteActionResult> {
  const { getQuote } = await import("@/lib/data/listings");
  const res = await getQuote(listingId, checkIn, checkOut);
  if (!res.ok) return { ok: false, error: res.message };
  return { ok: true, quote: res.quote };
}

/**
 * Server Actions bridge — thin, typed wrappers so client components call the
 * data layer without bespoke API routes. Auth flows redirect on success
 * (?next= resume); everything else returns a serialisable result.
 */

export interface FormResult {
  error?: string;
}

export async function signUpAction(
  email: string,
  password: string,
  name: string,
  next: string,
): Promise<FormResult> {
  const res = await signUp({ email, password, name });
  if (!res.ok) return { error: res.error ?? "Could not create your account." };
  revalidatePath("/", "layout");
  redirect(safeNextPath(next));
}

export async function signInAction(
  email: string,
  password: string,
  next: string,
): Promise<FormResult> {
  const res = await signIn(email, password);
  if (!res.ok) return { error: res.error ?? "Could not sign you in." };
  revalidatePath("/", "layout");
  redirect(safeNextPath(next));
}

export async function signOutAction(next: string): Promise<FormResult> {
  await signOut();
  revalidatePath("/", "layout");
  redirect(safeNextPath(next));
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

export async function createBookingAction(
  input: CreateBookingActionInput,
): Promise<CreateBookingActionResult> {
  const res = await createBooking(
    {
      listingId: input.listingId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
    },
    { cardName: input.cardName, cardLast4: input.cardLast4 },
  );
  if (!res.ok) return { ok: false, error: res.message };
  revalidatePath("/trips");
  return { ok: true, bookingId: res.booking.id };
}

export type ToggleFavouriteActionResult =
  | { ok: true; favourited: boolean }
  | { ok: false; error: string };

export async function toggleFavouriteAction(
  listingId: string,
): Promise<ToggleFavouriteActionResult> {
  const res = await toggleFavourite(listingId);
  if (!res.ok) return { ok: false, error: res.message };
  revalidatePath("/saved");
  return { ok: true, favourited: res.favourited };
}

export type CancelBookingActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function cancelBookingAction(
  bookingId: string,
): Promise<CancelBookingActionResult> {
  const { cancelBooking } = await import("@/lib/data/bookings");
  const res = await cancelBooking(bookingId);
  if (!res.ok) return { ok: false, error: res.message };
  revalidatePath("/trips");
  return { ok: true };
}

/** Persist the currency picker's choice (1 year, lax) and let RSC re-render. */
export async function setCurrencyAction(
  currency: string,
): Promise<{ ok: boolean; currency: CurrencyCode }> {
  if (!isCurrency(currency)) return { ok: false, currency: "EUR" };
  const store = await cookies();
  store.set(CURRENCY_COOKIE, currency, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
  });
  return { ok: true, currency };
}