import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

/**
 * Input — Buzzbnb ui primitive (design-tokens.md §5 Input recipe).
 * Label + hint + error with full a11y wiring: label[for], error/hint via
 * aria-describedby, invalid via aria-invalid. Only theme tokens are used.
 */

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Visible label; rendered above the field. Required for accessibility. */
  label: string;
  /** Supporting line shown below the field when there is no error. */
  hint?: string;
  /** Error message; switches the field to the danger treatment and overrides hint. */
  error?: string;
  /** Reserve space for the message row so layouts don't shift. */
  reserveMessageSpace?: boolean;
  /** Trailing adornment (e.g. show/hide password toggle button). */
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    reserveMessageSpace = false,
    trailing,
    id,
    className = "",
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `input-${autoId}`;
  const messageId = `${inputId}-msg`;
  const hasMessage = Boolean(error ?? hint);

  return (
    <div className={`w-full ${className}`}>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-xs font-medium text-ink-secondary"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          className={[
            "h-10 w-full rounded-md border bg-neutral-500 px-3 text-sm text-ink",
            "placeholder:text-ink-muted",
            "transition-[border-color,box-shadow] duration-120 ease-out-soft",
            "focus:border-accent-500 focus:shadow-[0_0_0_3px_oklch(0.752_0.043_144/0.4)] focus:outline-none",
            error ? "border-danger-400" : "border-neutral-600",
            trailing ? "pr-10" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {trailing}
          </div>
        ) : null}
      </div>
      {(hasMessage || reserveMessageSpace) && (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={[
            "mt-1 text-xs",
            error ? "text-danger-400" : "text-ink-muted",
            !hasMessage ? "invisible" : "",
          ].join(" ")}
        >
          {error ?? hint ?? "\u00A0"}
        </p>
      )}
    </div>
  );
});