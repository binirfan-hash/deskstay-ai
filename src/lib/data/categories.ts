import type { CategoryDTO, CategoryWithCount } from "@/lib/types";

/**
 * Categories — filter chips on the home page (contract §3.4).
 * Always 200-shaped: returns [] when unseeded, never throws.
 */
export async function getCategories(): Promise<CategoryDTO[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, icon")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`getCategories: ${error.message}`);
  return (data ?? []) as CategoryDTO[];
}

/** Categories with a computed listing count (only categories that have ≥1 active listing are counted). */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [catsRes, listingsRes] = await Promise.all([
    supabase.from("categories").select("id, slug, name, icon").order("sort_order", { ascending: true }),
    supabase.from("listings").select("category_id").eq("active", true),
  ]);

  if (catsRes.error) throw new Error(`getCategoriesWithCounts: ${catsRes.error.message}`);
  if (listingsRes.error) throw new Error(`getCategoriesWithCounts: ${listingsRes.error.message}`);

  const counts = new Map<string, number>();
  for (const row of (listingsRes.data ?? []) as { category_id: string }[]) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }

  return ((catsRes.data ?? []) as CategoryDTO[]).map((c) => ({
    ...c,
    listingCount: counts.get(c.id) ?? 0,
  }));
}