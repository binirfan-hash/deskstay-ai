import Link from "next/link";

/**
 * CategoryChipsRow — server-rendered chip row linking to /?category=slug
 * (one active at a time per the filter contract). Rendered as links (not
 * toggle buttons) so chips are shareable/crawlable URLs.
 */
/** Seed icon names are Material Symbols slugs — map to emoji for chip display. */
const CATEGORY_EMOJI: Record<string, string> = {
  panorama: "🌄",
  waves: "🏖",
  cabin: "🛖",
  brush: "🎨",
  building: "🏙",
  tractor: "🌾",
  pool: "🏊",
  gem: "💎",
};

export default function CategoryChipsRow({
  categories,
  activeSlug,
  extraParams,
}: {
  categories: { id: string; slug: string; name: string; icon: string }[];
  activeSlug?: string;
  extraParams?: Record<string, string>;
}) {
  const buildHref = (slug?: string) => {
    const params = new URLSearchParams(extraParams ?? {});
    if (slug) params.set("category", slug);
    else params.delete("category");
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <nav aria-label="Browse by category" className="w-full">
      <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-inline:4px] snap-x snap-mixed sm:[scrollbar-width:auto]">
        <li className="shrink-0 snap-start">
          <Link
            href={buildHref()}
            aria-current={!activeSlug ? "true" : undefined}
            className={`inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-xs transition-[background-color,border-color,color] duration-120 ease-out-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 sm:h-8 ${
              !activeSlug
                ? "border-accent-500 bg-accent-500 font-semibold text-brand-ink"
                : "border-accent-700 bg-accent-600 font-medium text-brand-ink hover:bg-accent-500"
            }`}
          >
            All stays
          </Link>
        </li>
        {categories.map((c) => {
          const active = activeSlug === c.slug;
          return (
            <li key={c.id} className="shrink-0 snap-start">
              <Link
                href={buildHref(c.slug)}
                aria-current={active ? "true" : undefined}
                className={`inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-xs transition-[background-color,border-color,color] duration-120 ease-out-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 sm:h-8 ${
                  active
                    ? "border-accent-500 bg-accent-500 font-semibold text-brand-ink"
                    : "border-accent-700 bg-accent-600 font-medium text-brand-ink hover:bg-accent-500"
                }`}
              >
                {CATEGORY_EMOJI[c.icon] ? (
                  <span aria-hidden="true" className="mr-1.5">{CATEGORY_EMOJI[c.icon]}</span>
                ) : null}
                {c.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}