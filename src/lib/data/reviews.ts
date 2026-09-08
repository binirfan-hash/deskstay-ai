import type { Review } from "@/lib/types";

/**
 * Reviews — READ ONLY additive helper (frontend-owned file).
 * Writes to public.reviews stay owned by the backend/data layer (contract
 * amendment A1: do not bypass or extend write surfaces from the frontend).
 *
 * RLS (reviews_select_gated) allows reading rows with booking_id set —
 * verified-stay reviews. The listing page renders whatever the anon/authed
 * caller can see, and treats an empty result as "no reviews yet".
 */
export interface ReviewsResult {
  reviews: (Review & { authorName: string; authorAvatar: string | null })[];
  error: string | null;
}

export async function getReviewsForListing(
  listingId: string,
  limit = 10,
): Promise<ReviewsResult> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `id, listing_id, booking_id, author_id, rating, comment, created_at,
       profiles:profiles!reviews_author_id_fkey (name, avatar_url)`,
    )
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // Verified-stay gating means the table is usually empty for a fresh demo —
    // surface a friendly empty state rather than failing the whole page.
    return { reviews: [], error: error.message };
  }

  const rows = (data ?? []) as unknown as {
    id: string;
    listing_id: string;
    booking_id: string | null;
    author_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    profiles: { name: string; avatar_url: string | null } | null;
  }[];

  return {
    reviews: rows.map((r) => ({
      id: r.id,
      listing_id: r.listing_id,
      booking_id: r.booking_id,
      author_id: r.author_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      authorName: r.profiles?.name ?? "Guest",
      authorAvatar: r.profiles?.avatar_url ?? null,
    })),
    error: null,
  };
}