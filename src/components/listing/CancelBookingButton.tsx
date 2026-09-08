"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cancelBookingAction } from "@/app/actions";
import { friendlyBookingError } from "@/lib/errors";

/**
 * CancelBookingButton — client cancel with a native confirm() dialog,
 * wired to the bookings data layer via a server action.
 */
export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function doCancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelBookingAction(bookingId);
      if (!res.ok) setError(friendlyBookingError(res.error));
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {confirming ? (
        <div className="flex items-center gap-2" role="group" aria-label="Confirm cancellation">
          <span className="text-xs text-ink-secondary">Cancel this trip?</span>
          <Button variant="danger" size="sm" loading={pending} onClick={doCancel}>
            Yes, cancel
          </Button>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
            Keep it
          </Button>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
          Cancel trip
        </Button>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger-400">
          {error}
        </p>
      )}
    </div>
  );
}