"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createBookingAction } from "@/app/actions";
import { friendlyBookingError } from "@/lib/errors";
import { formatMoney, type CurrencyCode, type RateInfo } from "@/lib/currency";

/**
 * PaymentForm — mock checkout (contract §3.7; ux-flows §5):
 * pure-UI card form (name/number/expiry/cvc) with format validation,
 * stores ONLY {cardName, cardLast4} in payment_mock. Confirm booking →
 * createBooking via the data layer; renders the success state with the
 * booking summary, and maps DB errors (BOOKING_DATES_UNAVAILABLE etc.)
 * to friendly copy.
 */

interface QuoteView {
  available: boolean;
  nights: number;
  pricePerNightCents: number;
  subtotalCents: number;
  serviceFeeCents: number;
  totalCents: number;
}

export function PaymentForm({
  listingId,
  listingName,
  city,
  country,
  checkIn,
  checkOut,
  guests,
  quote,
  currency,
  rates,
}: {
  listingId: string;
  listingName: string;
  city: string;
  country: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  quote: QuoteView;
  currency: CurrencyCode;
  rates: RateInfo;
}) {
  const rate = rates.rates[currency] ?? 1;
  const money = (centsEur: number) => formatMoney(centsEur, currency, rate);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    cardName?: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
  }>({});

  const [created, setCreated] = useState<{
    bookingId: string;
    total: number;
    last4: string;
  } | null>(null);

  function validate(cardName: string, cardNumber: string, expiry: string, cvc: string): boolean {
    const errs: typeof fieldErrors = {};
    if (cardName.trim().length === 0) errs.cardName = "Enter the name on the card.";
    const digits = cardNumber.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(digits)) errs.cardNumber = "Enter a valid card number (13–19 digits).";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) errs.cardExpiry = "Expiry must be MM/YY.";
    if (!/^\d{3,4}$/.test(cvc)) errs.cardCvc = "CVC must be 3–4 digits.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    const cardName = String(data.get("cardName") ?? "").trim();
    const cardNumber = String(data.get("cardNumber") ?? "").replace(/\s/g, "");
    const expiry = String(data.get("cardExpiry") ?? "").trim();
    const cvc = String(data.get("cardCvc") ?? "").trim();

    if (!validate(cardName, cardNumber, expiry, cvc)) return;
    const cardLast4 = cardNumber.slice(-4);

    startTransition(async () => {
      const res = await createBookingAction({
        listingId,
        checkIn,
        checkOut,
        guests,
        cardName,
        cardLast4,
      });
      if (res.ok) {
        setCreated({ bookingId: res.bookingId, total: quote.totalCents, last4: cardLast4 });
      } else {
        setFormError(friendlyBookingError(res.error));
        window?.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  // ---- success state -------------------------------------------------------
  if (created) {
    return (
      <div className="rounded-lg border border-accent-600 bg-surface p-6 text-center" role="status">
        <p className="text-4xl" aria-hidden="true">🎉</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Booking confirmed</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          {listingName} · {city}, {country}
        </p>
        <dl className="mx-auto mt-4 flex max-w-xs flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-secondary">Check-in</dt>
            <dd className="tnum text-ink">{checkIn}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-secondary">Check-out</dt>
            <dd className="tnum text-ink">{checkOut}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-secondary">Guests</dt>
            <dd className="tnum text-ink">{guests}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-600 pt-1">
            <dt className="text-ink-secondary">Total charged (mock)</dt>
            <dd className="tnum font-semibold text-ink">{money(created.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-secondary">Card</dt>
            <dd className="tnum text-ink">•••• {created.last4}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-ink-muted">
          Charged in EUR, shown in {currency} (indicative rate
          {rates.ratesAsOf ? `, ${rates.ratesAsOf}` : ""}).
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link
            href="/trips"
            className="inline-flex h-10 items-center rounded-md bg-accent-500 px-4 text-sm font-semibold text-brand-ink transition-colors duration-120 ease-out-soft hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            View your trips
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-md border border-brand-border px-4 text-sm font-semibold text-accent-300 transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
          >
            Keep exploring
          </Link>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Demo project — no real payment was taken. Ref {created.bookingId.slice(0, 8).toUpperCase()}.
        </p>
      </div>
    );
  }

  // ---- payment form --------------------------------------------------------
  return (
    <form onSubmit={handleConfirm} noValidate className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-4 rounded-lg border border-neutral-600 bg-surface p-4" aria-label="Mock payment details">
        <legend className="px-1 text-sm font-semibold text-ink">Payment details</legend>
        <p className="text-xs text-ink-muted">
          Demo checkout — nothing is charged. Only the card name and last 4 digits are stored.
        </p>
        <Input label="Name on card" name="cardName" autoComplete="cc-name" placeholder="Ada Lovelace" error={fieldErrors.cardName} required />
        <Input
          label="Card number"
          name="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          error={fieldErrors.cardNumber}
          required
          maxLength={23}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Expiry (MM/YY)" name="cardExpiry" inputMode="numeric" autoComplete="cc-exp" placeholder="09/28" error={fieldErrors.cardExpiry} required maxLength={5} />
          <Input label="CVC" name="cardCvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" error={fieldErrors.cardCvc} required maxLength={4} />
        </div>
      </fieldset>

      {formError && (
        <p role="alert" className="rounded-md border border-danger-500 bg-danger-600/20 px-3 py-2 text-sm text-danger-400">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={pending} disabled={!quote.available}>
        {quote.available ? `Confirm and pay ${money(quote.totalCents)}` : "Dates unavailable"}
      </Button>
      <p className="text-center text-xs text-ink-muted">
        Mock checkout — no real charge. Cancel anytime from your trips page.
      </p>
      <Link
        href={`/listing/${listingId}`}
        className="text-center text-sm text-accent-300 transition-colors duration-120 ease-out-soft hover:text-accent-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        ← Back to listing
      </Link>
    </form>
  );
}