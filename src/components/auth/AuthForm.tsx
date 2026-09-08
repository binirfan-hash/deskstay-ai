"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signInAction, signUpAction } from "@/app/actions";
import { friendlyAuthError } from "@/lib/errors";

/**
 * AuthForm — shared client form for /login and /signup (ux-flows.md §7).
 * Wired to the auth data layer via server actions; resumes the ?next=
 * param on success (e.g. checkout), surfaces friendly auth errors.
 */

export interface AuthFormProps {
  mode: "login" | "signup";
  /** Path to redirect to after success (safe internal path). */
  nextPath: string;
}

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
  }>({});

  function validate(email: string, password: string, name: string): boolean {
    const errs: typeof fieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    }
    if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    if (mode === "signup" && name.trim().length === 0) {
      errs.name = "Tell us your name.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "").trim();

    if (!validate(email, password, name)) return;

    startTransition(async () => {
      const res =
        mode === "signup"
          ? await signUpAction(email, password, name, nextPath)
          : await signInAction(email, password, nextPath);
      // redirect() inside the action throws a control-flow signal on success;
      // a returned value here means the action failed gracefully.
      if (res?.error) {
        setFormError(friendlyAuthError(res.error));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {mode === "signup" && (
        <Input
          label="Name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          error={fieldErrors.name}
          required
          maxLength={80}
        />
      )}
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={fieldErrors.email}
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
        error={fieldErrors.password}
        required
      />

      {formError && (
        <p role="alert" className="rounded-md border border-danger-500 bg-danger-600/20 px-3 py-2 text-sm text-danger-400">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {mode === "signup" ? "Create account" : "Log in"}
      </Button>

      <button
        type="button"
        onClick={() => router.push(mode === "login" ? `/signup?next=${encodeURIComponent(nextPath)}` : `/login?next=${encodeURIComponent(nextPath)}`)}
        className="text-sm text-accent-300 transition-colors duration-120 ease-out-soft hover:text-accent-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        {mode === "login" ? "New to DeskStay? Sign up" : "Already have an account? Log in"}
      </button>
    </form>
  );
}