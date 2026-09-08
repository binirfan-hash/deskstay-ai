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
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const strings = spToStrings(sp);
  const nextPath = safeNextPath(strings.next);

  const profile = await getCurrentProfile().catch(() => null);
  if (profile) redirect(nextPath);

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