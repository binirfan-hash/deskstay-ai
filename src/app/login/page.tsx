import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentProfile } from "@/lib/auth";
import { spToStrings, safeNextPath, type SearchParams } from "@/lib/searchParams";

/**
 * Login — form wired to the auth data layer (ux-flows §2).
 * Redirects to ?next= after success (checkout resume), or home.
 * Already signed in? Straight to the next path.
 */
export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
}) {
  // STATIC-DEMO: no searchParams reads. The static host has no ?next=
  // resume; the demo notice covers sign-in attempts.
  const strings: Record<string, string> = {};
  const nextPath = safeNextPath(undefined);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <AuthShell
        title="Welcome back"
        subtitle="Log in to book work-ready stays and keep your plans in sync."
      >
        <AuthForm mode="login" nextPath={nextPath} />
      </AuthShell>
      <Footer />
    </div>
  );
}