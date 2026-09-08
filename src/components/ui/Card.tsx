import type { ElementType, HTMLAttributes, ReactNode } from "react";

/**
 * Card — Buzzbnb surface primitive (design-tokens.md §5 card recipe).
 * The generic shell; the specialised money component lives in
 * src/components/listing/ListingCard.tsx.
 *
 * Polymorphic via the `as` prop so it can render an <article>/<li> at call
 * sites without nesting interactive elements inside buttons.
 */

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Element to render as (defaults to div). */
  as?: ElementType;
  /** Applies the shared hover lift (only meaningful when the card is clickable). */
  interactive?: boolean;
  /** Elevated treatment (lighter warm surface) vs default card surface. */
  tone?: "surface" | "elevated";
  children?: ReactNode;
}

export function Card({
  as: Tag = "div",
  interactive = false,
  tone = "surface",
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={[
        "overflow-hidden rounded-lg border border-neutral-600 shadow-card",
        tone === "elevated" ? "bg-elevated" : "bg-surface",
        interactive ? "card-hover" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}
export function CardHeader({ className = "", ...rest }: CardSectionProps) {
  return <div className={`px-4 pt-4 ${className}`} {...rest} />;
}
export function CardBody({ className = "", ...rest }: CardSectionProps) {
  return <div className={`px-4 py-3 ${className}`} {...rest} />;
}
export function CardFooter({ className = "", ...rest }: CardSectionProps) {
  return <div className={`px-4 pb-4 ${className}`} {...rest} />;
}