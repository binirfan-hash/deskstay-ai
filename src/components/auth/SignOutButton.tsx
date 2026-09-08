"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/app/actions";

/**
 * SignOutButton — thin client wrapper for the Navbar user menu.
 */
export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      className="h-10 px-3 sm:h-8 sm:px-3"
      onClick={() => startTransition(async () => void (await signOutAction("/")))}
    >
      Sign out
    </Button>
  );
}