"use client";

import { useMemo } from "react";
import { buildStayPlan, type WorkReadiness } from "@/lib/deskstay";

/**
 * StayPlan — "AI-assisted plan" section on listing detail (PIVOT_DESKSTAY.md).
 * Renders a deterministic day-by-day work plan generated CLIENT-SIDE from the
 * listing's own fields — no external AI API call. Hidden entirely until both
 * dates are chosen (the plan needs a real stay window).
 */
export function StayPlan({
  checkIn,
  checkOut,
  work,
  listingName,
  className = "",
}: {
  checkIn: string | null;
  checkOut: string | null;
  work: WorkReadiness;
  listingName: string;
  className?: string;
}) {
  const plan = useMemo(
    () =>
      checkIn && checkOut
        ? buildStayPlan(checkIn, checkOut, work, listingName)
        : { days: [], truncated: false, timezoneSummary: null },
    [checkIn, checkOut, work, listingName],
  );

  if (!checkIn || !checkOut || plan.days.length === 0) return null;

  return (
    <section aria-labelledby="stay-plan-heading" className={className}>
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 id="stay-plan-heading" className="font-display text-lg font-semibold text-ink">
          Your stay plan
        </h2>
        <span className="rounded-sm bg-accent-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] text-brand-ink">
          AI-assisted plan
        </span>
      </div>
      {plan.timezoneSummary && (
        <p className="mt-1 text-sm text-ink-secondary">
          All times are local to the stay: {plan.timezoneSummary}.
        </p>
      )}

      <ol className="mt-4 flex flex-col gap-3">
        {plan.days.map((day) => (
          <li
            key={day.dateLabel}
            className="rounded-lg border border-neutral-600 bg-surface p-4"
          >
            <p className="text-sm font-semibold text-ink tnum">{day.dateLabel}</p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-secondary">
              <li>
                <span className="mr-2" aria-hidden="true">💻</span>
                {day.workBlock}
              </li>
              <li>
                <span className="mr-2" aria-hidden="true">☕</span>
                {day.cafe}
              </li>
              <li className="text-ink-muted">
                <span className="mr-2" aria-hidden="true">🕑</span>
                {day.timezoneTip}
              </li>
            </ul>
          </li>
        ))}
      </ol>

      {plan.truncated && (
        <p className="mt-3 text-xs text-ink-muted">
          Plan shows the first 14 days — the same rhythm continues for the rest
          of your stay.
        </p>
      )}
    </section>
  );
}