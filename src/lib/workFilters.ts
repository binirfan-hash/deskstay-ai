import type { ListingSummary } from "@/lib/types";
import { workFieldsOf, type WorkReadiness } from "@/lib/deskstay";

/**
 * Work-filter resolution.
 *
 * PIVOT_DESKSTAY.md adds min_wifi / min_desk / max_noise filters. The live
 * listings table does NOT have those columns until the orchestrator's
 * migration lands, and src/lib/data is frozen (frontend may not extend the
 * Supabase query surface). Resolution therefore runs SERVER-SIDE over the
 * fetched page (max 50 rows per the data layer's cap — the demo seed is
 * 24 listings, so this is exact for the demo dataset; approximate beyond).
 *
 * When the migration lands, move these into ListingFilters + the Supabase
 * query in src/lib/data/listings.ts and delete this file. Everything is
 * null-safe: rows missing work fields are dropped when a work filter is
 * active (they cannot prove they qualify).
 */

export interface HomeWorkFilters {
  minWifi?: number;
  minDesk?: number;
  maxNoise?: number;
}

export function applyWorkFilters<T extends ListingSummary>(
  listings: T[],
  f: HomeWorkFilters,
): T[] {
  const needsFilter =
    (f.minWifi !== undefined && f.minWifi > 0) ||
    (f.minDesk !== undefined && f.minDesk >= 1) ||
    (f.maxNoise !== undefined && f.maxNoise >= 1 && f.maxNoise <= 5);
  if (!needsFilter) return listings;

  return listings.filter((l) => {
    const w: WorkReadiness = workFieldsOf(l as never);
    if (f.minWifi !== undefined && f.minWifi > 0) {
      if (w.wifiMbps === null || w.wifiMbps < f.minWifi) return false;
    }
    if (f.minDesk !== undefined && f.minDesk >= 1) {
      if (w.deskQuality === null || w.deskQuality < f.minDesk) return false;
    }
    if (f.maxNoise !== undefined && f.maxNoise >= 1 && f.maxNoise <= 5) {
      if (w.noiseLevel === null || w.noiseLevel > f.maxNoise) return false;
    }
    return true;
  });
}