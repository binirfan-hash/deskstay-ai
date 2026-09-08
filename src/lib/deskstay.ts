/**
 * DeskStay AI scoring + work-readiness presentation (collab/PIVOT_DESKSTAY.md).
 *
 * The DeskStay Score is DETERMINISTIC and this file is the single source of
 * truth for the formula. Work-readiness fields are nullable on listing rows
 * until the orchestrator's migration lands — every helper here
 * degrades gracefully (returns null / hides badges) when they are absent.
 */

/** Work-readiness fields as they will arrive on listing rows post-migration. */
export interface WorkFields {
  wifi_mbps?: number | null;
  desk_quality?: number | null; // 1..5
  noise_level?: number | null; // 1..5, 5 = silent
  safety_score?: number | null; // 1..5
  cafes_nearby?: number | null;
  timezone?: string | null; // IANA
  deskstay_score?: number | null; // precomputed column, when present
}

export interface WorkReadiness {
  wifiMbps: number | null;
  deskQuality: number | null;
  noiseLevel: number | null;
  safetyScore: number | null;
  cafesNearby: number | null;
  timezone: string | null;
}

/** Extract the (nullable) work fields from a row that carries them optionally. */
export function workFieldsOf(row: WorkFields): WorkReadiness {
  // Tolerates BOTH shapes: raw DB rows (snake_case) and camelCase DTOs
  // (ListingSummary/WorkReadiness). Components may receive either — e.g. the
  // listing page pre-converts to WorkReadiness then passes it into panels
  // that call workFieldsOf again — so the second pass must be a no-op.
  const r = row as Record<string, unknown>;
  const pick = (snake: string, camel: string): number | null => {
    const v = r[snake] !== undefined && r[snake] !== null ? r[snake] : r[camel];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };
  const tz = r.timezone !== undefined && r.timezone !== null ? r.timezone : null;
  return {
    wifiMbps: pick("wifi_mbps", "wifiMbps"),
    deskQuality: pick("desk_quality", "deskQuality"),
    noiseLevel: pick("noise_level", "noiseLevel"),
    safetyScore: pick("safety_score", "safetyScore"),
    cafesNearby: pick("cafes_nearby", "cafesNearby"),
    timezone: typeof tz === "string" ? tz : null,
  };
}

/**
 * DeskStay Score — exact formula from PIVOT_DESKSTAY.md:
 * score = round(0.30*min(wifi/200,1)*100 + 0.20*(desk/5)*100 + 0.15*(noise/5)*100
 *             + 0.15*(safety/5)*100 + 0.10*min(cafes/10,1)*100 + 0.10*budget_fit*100)
 * budget_fit = 1 if price <= 15000c else max(0, 1 - (price-15000)/30000)
 * Returns null when any metric is missing (partial data ⇒ no score shown).
 */
export function deskStayScore(
  w: WorkReadiness,
  priceCents: number,
): number | null {
  const { wifiMbps, deskQuality, noiseLevel, safetyScore, cafesNearby } = w;
  if (
    wifiMbps === null ||
    deskQuality === null ||
    noiseLevel === null ||
    safetyScore === null ||
    cafesNearby === null
  ) {
    return null;
  }
  const budgetFit =
    priceCents <= 15_000
      ? 1
      : Math.max(0, 1 - (priceCents - 15_000) / 30_000);

  const raw =
    0.3 * Math.min(wifiMbps / 200, 1) * 100 +
    0.2 * (deskQuality / 5) * 100 +
    0.15 * (noiseLevel / 5) * 100 +
    0.15 * (safetyScore / 5) * 100 +
    0.1 * Math.min(cafesNearby / 10, 1) * 100 +
    0.1 * budgetFit * 100;

  return Math.round(raw);
}

/** Score to display: precomputed column when present, else computed locally. */
export function scoreOf(
  row: WorkFields,
  priceCents: number,
): number | null {
  if (typeof row.deskstay_score === "number") return row.deskstay_score;
  return deskStayScore(workFieldsOf(row), priceCents);
}

/** Score → ring colour tier (token utilities; no raw hex). */
export function scoreTier(score: number): {
  ring: string;
  text: string;
  label: string;
} {
  if (score >= 85)
    return { ring: "text-accent-400", text: "text-accent-300", label: "Excellent" };
  if (score >= 70)
    return { ring: "text-accent-500", text: "text-accent-300", label: "Great" };
  if (score >= 50)
    return { ring: "text-accent-700", text: "text-accent-100", label: "Decent" };
  return { ring: "text-neutral-400", text: "text-ink-secondary", label: "Basic" };
}

// -----------------------------------------------------------------------
// Stay Plan — deterministic, client-side "AI-assisted plan" (no network)
// -----------------------------------------------------------------------

export interface PlanDay {
  dateLabel: string;
  workBlock: string;
  cafe: string;
  timezoneTip: string;
}

const CAFE_TYPES = [
  "the espresso bar two doors down",
  "the corner café with window seats",
  "the bakery café on the square",
  "the laptop-friendly roastery nearby",
  "the quiet tea house around the block",
];

const WORK_BLOCKS = [
  "Morning deep work",
  "Morning focus block",
  "Morning builder session",
  "Morning deep-work sprint",
];

/**
 * Build the day-by-day stay plan from the listing's own fields.
 * Deterministic: same inputs always render the same plan. Days beyond 14
 * collapse (long stays don't need a 60-row table) — callers show a note.
 */
export function buildStayPlan(
  checkIn: string,
  checkOut: string,
  w: WorkReadiness,
  listingName: string,
): { days: PlanDay[]; truncated: boolean; timezoneSummary: string | null } {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { days: [], truncated: false, timezoneSummary: null };
  }

  const total = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 86_400_000),
  );
  const shown = Math.min(total, 14);

  let tzSummary: string | null = null;
  if (w.timezone) {
    try {
      const now = new Date();
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: w.timezone,
        timeZoneName: "shortOffset",
      });
      const parts = fmt.formatToParts(now);
      const tzName =
        parts.find((p) => p.type === "timeZoneName")?.value ?? "";
      tzSummary = `${w.timezone.replace(/_/g, " ")} (${tzName})`;
    } catch {
      tzSummary = w.timezone.replace(/_/g, " ");
    }
  }

  const days: PlanDay[] = [];
  for (let i = 0; i < shown; i++) {
    const d = new Date(start.getTime());
    d.setDate(start.getDate() + i);
    const dateLabel = new Intl.DateTimeFormat("en-IE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(d);

    const cafe = w.cafesNearby
      ? CAFE_TYPES[(i + listingName.length) % CAFE_TYPES.length]
      : "a nearby café — check the map on arrival";

    const isLast = i === total - 1;
    const noise =
      w.noiseLevel !== null && w.noiseLevel >= 4
        ? "the space stays quiet — ideal for calls"
        : w.noiseLevel !== null && w.noiseLevel <= 2
          ? "some ambient noise — favour muted sessions or the café booth"
          : "moderate ambient noise — schedule calls mid-morning";

    const tzTip = w.timezone
      ? i === 0
        ? tzSummary
          ? `Local time zone is ${tzSummary} — anchor your first work block to it.`
          : `Anchor your first work block to ${w.timezone}.`
        : `Stay anchored to the stay's local time — ${noise}.`
      : noise;

    days.push({
      dateLabel,
      workBlock: isLast
        ? "Light morning session, then checkout prep"
        : `${WORK_BLOCKS[i % WORK_BLOCKS.length]} at the desk`,
      cafe: isLast
        ? "Grab a takeaway coffee for the journey"
        : `Cafe break: ${cafe}`,
      timezoneTip: tzTip,
    });
  }

  return { days, truncated: total > shown, timezoneSummary: tzSummary };
}