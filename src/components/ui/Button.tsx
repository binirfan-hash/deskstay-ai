import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Button — Buzzbnb ui primitive (design-tokens.md §5 Button recipe).
 * Variants primary/secondary/ghost/danger, three sizes, loading state.
 * Accent surfaces always carry dark ink (brand-ink) — never light text on sage.
 * `sm` is 40px on touch widths (≥44px guidance) and 32px from `sm:` up.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows an inline spinner and disables interaction. */
  loading?: boolean;
  /** Full-width button (form submits, CTAs). */
  fullWidth?: boolean;
  children?: ReactNode;
}

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-[background-color,border-color,color] duration-120 ease-out-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:bg-neutral-500 disabled:text-neutral-300 disabled:border-transparent";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-500 text-brand-ink border border-transparent hover:not-disabled:bg-accent-400 active:not-disabled:bg-accent-600",
  secondary:
    "bg-transparent text-accent-300 border border-brand-border hover:not-disabled:bg-neutral-900",
  ghost:
    "bg-transparent text-ink-secondary border border-transparent hover:not-disabled:bg-neutral-700",
  danger:
    "bg-danger-500 text-brand-ink border border-transparent hover:not-disabled:bg-danger-600",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-3 text-xs sm:h-8",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      type = "button",
      children,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={[
          base,
          variants[variant],
          sizes[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {loading ? <Spinner /> : null}
        {children}
      </button>
    );
  },
);

/** Spinner inherits currentColor so it reads on every variant. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`size-4 shrink-0 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}