import { forwardRef } from "react";

/**
 * Avatar — user/host portrait with fallback initials (design-tokens.md §5
 * avatar recipe). Plain <img>, not next/image: avatars arrive as arbitrary
 * remote URLs (Supabase Storage / picsum) and are tiny — optimization adds
 * nothing and the loader config would need per-host patterns.
 */

export interface AvatarProps {
  src?: string | null;
  /** Used for the initials fallback and alt text. */
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  /** Show the sage ring used for superhost emphasis. */
  ring?: boolean;
  className?: string;
}

const sizes = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
} as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, name, size = "md", ring = false, className = "" },
  ref,
) {
  return (
    <span
      ref={ref}
      title={name}
      className={[
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        // accent-600 bg + brand-ink initials = 4.77:1 (accent-800/accent-100 failed at 2.67:1)
        "bg-accent-600 font-semibold text-brand-ink",
        sizes[size],
        ring ? "ring-2 ring-accent-500" : "",
        className,
      ].join(" ")}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny remote avatars; see file note
        <img src={src} alt={name} className="size-full object-cover" loading="lazy" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
});