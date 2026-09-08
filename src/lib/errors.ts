/**
 * Friendly copy for data-layer failure reasons / Postgres error messages
 * (ux-flows.md: map DB errors to human copy; never leak raw SQL).
 */
export function friendlyBookingError(message: string): string {
  if (message.includes("BOOKING_DATES_UNAVAILABLE")) {
    return "Those dates were just booked by someone else. Pick different dates and try again.";
  }
  if (message.includes("BOOKING_DATES_INVALID")) {
    return "Those dates don't work — check-out must be after check-in.";
  }
  if (message.includes("row-level security") || message.includes("42501")) {
    return "You don't have permission to do that. Try signing in again.";
  }
  if (message.toLowerCase().includes("guest")) {
    return "Adjust the number of guests and try again.";
  }
  if (message.toLowerCase().includes("payment")) {
    return "Check your card details and try again.";
  }
  return "Something went wrong on our side. Please try again in a moment.";
}

/** Auth error copy — Supabase messages are decent but inconsistent. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "An account with this email already exists — try logging in.";
  }
  if (m.includes("password") && m.includes("least")) {
    return message; // Supabase already says "at least N characters"
  }
  if (m.includes("rate limit")) {
    return "Too many attempts — wait a minute and try again.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Can't reach the server — check your connection and try again.";
  }
  return message;
}