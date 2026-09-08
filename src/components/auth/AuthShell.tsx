import type { ReactNode } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

/**
 * AuthShell — centred card panel shared by /login and /signup.
 * Server component; children are the client form.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
      <Card tone="elevated" className="w-full max-w-md">
        <CardHeader>
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-secondary">{subtitle}</p>
        </CardHeader>
        <CardBody>{children}</CardBody>
      </Card>
    </div>
  );
}