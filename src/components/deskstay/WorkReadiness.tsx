import { scoreOf, scoreTier, workFieldsOf } from "@/lib/deskstay";

/**
 * DeskStayScoreBadge — compact "Score 92" pill for ListingCard overlays,
 * trip cards, and headers. Hidden entirely when no score can be derived
 * (pre-migration data keeps cards clean rather than showing duds).
 */
export function DeskStayScoreBadge({
  row,
  priceCents,
  className = "",
}: {
  row: Parameters<typeof scoreOf>[0];
  priceCents: number;
  className?: string;
}) {
  const score = scoreOf(row, priceCents);
  if (score === null) return null;
  const tier = scoreTier(score);
  return (
    <span
      className={`inline-flex h-[22px] items-center gap-1 rounded-sm bg-neutral-900 px-2 text-xs font-semibold text-accent-200 tnum ${className}`}
      aria-label={`DeskStay Score ${score} out of 100 — ${tier.label}`}
    >
      Score {score}
    </span>
  );
}

/**
 * WorkBadges — the compact per-card work line:
 * "⚡ 240 Mbps · 🖥 Desk 5/5 · Score 92". Emoji are decorative; the whole
 * row is one readable string so it never relies on colour.
 */
export function WorkBadges({
  row,
  priceCents,
  className = "",
}: {
  row: Parameters<typeof scoreOf>[0];
  priceCents: number;
  className?: string;
}) {
  const w = workFieldsOf(row);
  const score = scoreOf(row, priceCents);
  const parts: string[] = [];
  if (w.wifiMbps !== null) parts.push(`⚡ ${w.wifiMbps} Mbps`);
  if (w.deskQuality !== null) parts.push(`🖥 Desk ${w.deskQuality}/5`);
  if (score !== null) parts.push(`Score ${score}`);
  if (parts.length === 0) return null;

  return (
    <p className={`truncate text-xs text-ink-secondary tnum ${className}`}>
      {parts.join(" · ")}
    </p>
  );
}

/** Small SVG ring showing a 0–100 score; used by the Work-Readiness panel. */
export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const tier = scoreTier(score);
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * c;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`DeskStay Score ${score} out of 100`}
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-neutral-600"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${c - filled}`}
        className={tier.ring}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className={`rotate-90 fill-current text-sm font-semibold tnum ${tier.text}`}
        style={{ transformOrigin: "center" }}
      >
        {score}
      </text>
    </svg>
  );
}

const METRIC_LABELS: Record<string, string> = {
  wifiMbps: "Wi-Fi speed",
  deskQuality: "Desk quality",
  noiseLevel: "Quietness",
  safetyScore: "Safety",
  cafesNearby: "Cafés nearby",
  timezone: "Time zone",
};

/** Formats one metric row's value; null → "—". */
function metricValue(key: string, value: number | string | null): string {
  if (value === null) return "—";
  switch (key) {
    case "wifiMbps":
      return `${value} Mbps`;
    case "cafesNearby":
      return `${value} within 10 min walk`;
    case "noiseLevel":
      return `${value}/5 (5 = silent)`;
    case "timezone":
      return String(value); // IANA zone — never a 1..5 scale
    default:
      return `${value}/5`;
  }
}

/**
 * WorkReadinessPanel — all six metrics + score ring, listing detail page.
 * Degrades to "— / no data yet" rows when the migration hasn't landed.
 */
export function WorkReadinessPanel({
  row,
  priceCents,
  className = "",
}: {
  row: Parameters<typeof scoreOf>[0];
  priceCents: number;
  className?: string;
}) {
  const w = workFieldsOf(row);
  const score = scoreOf(row, priceCents);
  const tier = score !== null ? scoreTier(score) : null;

  const entries: [string, number | string | null][] = [
    ["wifiMbps", w.wifiMbps],
    ["deskQuality", w.deskQuality],
    ["noiseLevel", w.noiseLevel],
    ["safetyScore", w.safetyScore],
    ["cafesNearby", w.cafesNearby],
    ["timezone", w.timezone],
  ];

  return (
    <section
      aria-label="Work readiness"
      className={`rounded-lg border border-neutral-600 bg-surface p-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">
          Work readiness
        </h2>
        {score !== null && tier ? (
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold uppercase tracking-[0.05em] ${tier.text}`}>
              {tier.label}
            </span>
            <ScoreRing score={score} />
          </div>
        ) : (
          <span className="text-xs text-ink-muted">Scoring data coming soon</span>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        {entries.map(([key, value]) => (
          <div key={key} className="min-w-0">
            <dt className="text-xs text-ink-muted">{METRIC_LABELS[key]}</dt>
            <dd className="truncate text-sm font-medium text-ink tnum">
              {metricValue(key, value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}