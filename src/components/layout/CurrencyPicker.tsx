"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CURRENCY_LABELS,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
} from "@/lib/currency";
import { setCurrencyAction } from "@/app/actions";

/**
 * CurrencyPicker — Navbar control (binding requirement: multi-currency).
 * A native <select> (modal-less, keyboard-native, 40px target) that writes
 * the `deskstay_currency` cookie via a server action and refreshes the RSC
 * tree so every price re-renders server-side — no client-side conversion,
 * no flash, no hydration mismatch.
 */
export function CurrencyPicker({ current }: { current: CurrencyCode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label
      className={`flex items-center gap-1.5 text-xs text-ink-secondary ${pending ? "opacity-60" : ""}`}
    >
      <span className="hidden md:inline">Currency</span>
      <select
        aria-label="Display currency"
        value={current}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as CurrencyCode;
          startTransition(async () => {
            await setCurrencyAction(next);
            router.refresh();
          });
        }}
        className="h-10 rounded-md border border-neutral-600 bg-neutral-500 px-2 text-xs text-ink transition-colors duration-120 ease-out-soft focus:border-accent-500 focus:outline-none disabled:cursor-wait"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {CURRENCY_LABELS[c]}
          </option>
        ))}
      </select>
    </label>
  );
}