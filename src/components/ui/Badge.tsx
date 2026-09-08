import type { ReactNode } from "react";

/**
 * Badge — small status/feature pill (design-tokens.md §5 badge recipe).
 * Not interactive; use Chip for filters.
 */

export type BadgeTone = "sage" | "outline" | "danger" | "neutral";

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  // accent-600 bg + brand-ink text = 4.77:1 (accent-800/accent-100 failed at 2.67:1)
  sage: "bg-accent-600 text-brand-ink",
  outline: "border border-brand-border text-accent-300",
  // danger-500 + brand-ink = 4.66:1, matches the danger Button recipe
  danger: "bg-danger-500 text-brand-ink",
  neutral: "bg-neutral-600 text-ink-secondary",
};

export function Badge({ tone = "sage", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex h-[22px] items-center rounded-sm px-2 text-xs font-semibold uppercase tracking-[0.05em]",
        tones[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}