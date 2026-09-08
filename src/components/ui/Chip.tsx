import { forwardRef, type ButtonHTMLAttributes } from "react";

/**
 * Chip — category filter pill (design-tokens.md §5 chip recipe).
 * Renders as a toggle button (aria-pressed) — the filter contract ux-flows.md
 * §3.1 expects (chips toggle the category filter, one active at a time).
 */

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> {
  active?: boolean;
  children: string;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active = false, className = "", children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={[
        // base
        "inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-xs",
        "transition-[background-color,border-color,color] duration-120 ease-out-soft",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400",
        // states — accent-600 bg + brand-ink text = 4.77:1; active/hover accent-500
        // with brand-ink = 5.54:1 (accent-800/accent-100 failed contrast at 2.67:1)
        active
          ? "border-accent-500 bg-accent-500 font-semibold text-brand-ink"
          : "border-accent-700 bg-accent-600 font-medium text-brand-ink hover:not-disabled:bg-accent-500",
        "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-neutral-500 disabled:text-neutral-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
});