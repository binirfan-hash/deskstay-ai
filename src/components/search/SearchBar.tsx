"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { todayISO } from "@/lib/format";

/**
 * SearchBar — hero search (home page) and navbar compact search (ux-flows §3.1).
 * Pushes query params to "/" (location text, dates, guests); strips empties
 * so the URL stays canonical.
 */
export function SearchBar({
  initial,
  variant = "hero",
}: {
  initial?: Record<string, string>;
  variant?: "hero" | "compact";
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial?.q ?? "");
  const [checkIn, setCheckIn] = useState(initial?.check_in ?? "");
  const [checkOut, setCheckOut] = useState(initial?.check_out ?? "");
  const [guests, setGuests] = useState(initial?.guests ?? "");
  const [error, setError] = useState<string | null>(null);
  const minDay = todayISO();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (checkIn && checkOut && checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    if (guests) params.set("guests", guests);
    router.push(params.size > 0 ? `/?${params.toString()}` : "/");
  }

  const guestsInput = (
    <Input
      label="Guests"
      name="guests"
      type="number"
      inputMode="numeric"
      min={1}
      max={16}
      placeholder="2"
      value={guests}
      onChange={(e) => setGuests(e.target.value)}
      className={variant === "hero" ? "sm:w-28" : "w-24"}
    />
  );

  if (variant === "compact") {
    return (
      <form
        onSubmit={submit}
        role="search"
        aria-label="Search stays"
        className="flex items-end gap-2"
      >
        <Input label="Where" name="q" placeholder="City or name" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        {guestsInput}
        <Button type="submit">Search</Button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} role="search" aria-label="Search stays" className="w-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <Input
          label="Where"
          name="q"
          placeholder="Search city, country, or stay name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Input
          label="Check-in"
          name="check_in"
          type="date"
          min={minDay}
          value={checkIn}
          onChange={(e) => {
            setCheckIn(e.target.value);
            if (checkOut && e.target.value && e.target.value >= checkOut) {
              setCheckOut("");
            }
          }}
        />
        <Input
          label="Check-out"
          name="check_out"
          type="date"
          min={checkIn || minDay}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
        {guestsInput}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-400">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="mt-4">
        Search stays
      </Button>
    </form>
  );
}