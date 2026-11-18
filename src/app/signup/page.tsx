import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentProfile } from "@/lib/auth";
import { spToStrings, safeNextPath, type SearchParams } from "@/lib/searchParams";

/**
 * Signup — form wired to the auth data layer (ux-flows §2).
 * Email auto-confirm is enabled (amendment A2), so signup signs the user
 * straight in and redirects to ?next= (or home).
 */
export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({
}) {
  // STATIC-DEMO: no searchParams reads. The static host has no ?next=
  // resume; the demo notice covers sign-in attempts.
  const strings: Record<string, string> = {};
  const nextPath = safeNextPath(undefined);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Navbar />
      <AuthShell
        title="Create your account"
        subtitle="One account for all your work-ready stays — saved places, trips, and plans."
      >
        <AuthForm mode="signup" nextPath={nextPath} />
      </AuthShell>
      <Footer />
    </div>
  );
}