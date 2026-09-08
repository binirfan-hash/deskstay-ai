import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { currencyFromRequest } from "@/lib/currencyMiddleware";

/**
 * Route middleware — refreshes the Supabase auth session on every matched
 * request (token refresh + cookie write-back) before rendering, then
 * ensures the currency cookie exists so RSC can convert prices server-side.
 */
export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  // Cookie backstop: safe to run even when updateSession short-circuits with
  // a redirect (it only touches the plain-navigation path).
  if (response.headers.get("location") === null) {
    return currencyFromRequest(request);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, image optimiser and favicon.
     * API routes ARE matched so their responses also carry refreshed cookies.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};