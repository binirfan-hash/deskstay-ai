"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * WorkFilterBar — price range + work-readiness filters (min wifi Mbps,
 * min desk quality, max noise). PIVOT_DESKSTAY.md §UI: timezone filters
 * are phase 2 and deliberately not present.
 *
 * Responsive: collapsed expandable row on mobile/tablet (aria-expanded +
 * aria-controls on the toggle), always-visible inline form on desktop
 * (lg: the toggle becomes a no-op "hide" affordance that just collapses
 * the panel, never losing access to the filters).
 */
export function WorkFilterBar({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const hasActive =
    Boolean(initial.min_price || initial.max_price || initial.min_wifi || initial.min_desk || initial.max_noise);
  const [open, setOpen] = useState(hasActive);
  const [minPrice, setMinPrice] = useState(initial.min_price ?? "");
  const [maxPrice, setMaxPrice] = useState(initial.max_price ?? "");
  const [minWifi, setMinWifi] = useState(initial.min_wifi ?? "");
  const [minDesk, setMinDesk] = useState(initial.min_desk ?? "");
  const [maxNoise, setMaxNoise] = useState(initial.max_noise ?? "");
  const sort = initial.sort ?? "newest";

  function buildParams(exclude: string[]): URLSearchParams {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(initial)) {
      if (v && !exclude.includes(k)) params.set(k, v);
    }
    return params;
  }

  function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = buildParams([
      "min_price", "max_price", "min_wifi", "min_desk", "max_noise", "sort", "offset",
    ]);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (minWifi) params.set("min_wifi", minWifi);
    if (minDesk) params.set("min_desk", minDesk);
    if (maxNoise) params.set("max_noise", maxNoise);
    if (sort && sort !== "newest") params.set("sort", sort);
    router.push(params.size > 0 ? `/?${params.toString()}` : "/");
  }

  function clear() {
    setMinPrice(""); setMaxPrice(""); setMinWifi(""); setMinDesk(""); setMaxNoise("");
    const params = buildParams([
      "min_price", "max_price", "min_wifi", "min_desk", "max_noise", "sort", "offset",
    ]);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          aria-expanded={open}
          aria-controls="work-filter-panel"
          onClick={() => setOpen((v) => !v)}
        >
          Filters{open ? " −" : " +"}
        </Button>
        <label className="flex items-center gap-2 text-xs text-ink-secondary">
          Sort
          <select
            value={sort}
            onChange={(e) => {
              const next = { ...initial, sort: e.target.value === "newest" ? "" : e.target.value };
              const params = buildParams(["sort", "offset"]);
              for (const [k, v] of Object.entries(next)) {
                if (v && !["sort", "offset"].includes(k)) params.set(k, v);
              }
              if (e.target.value !== "newest") params.set("sort", e.target.value);
              const qs = params.toString();
              router.push(qs ? `/?${qs}` : "/");
            }}
            className="h-10 rounded-md border border-neutral-600 bg-neutral-500 px-2 text-xs text-ink focus:border-accent-500 focus:outline-none sm:h-8"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="rating_desc">Top rated</option>
          </select>
        </label>
        {!open && hasActive && (
          <span className="text-xs text-ink-muted" aria-live="polite">
            Filters active
          </span>
        )}
      </div>

      {open && (
        <form
          id="work-filter-panel"
          onSubmit={apply}
          aria-label="Filter stays"
          className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-neutral-600 bg-surface p-4 sm:grid-cols-3 lg:grid-cols-5"
        >
          <Input label="Min price (€)" name="min_price" type="number" min={0} placeholder="50" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <Input label="Max price (€)" name="max_price" type="number" min={0} placeholder="200" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          <Input label="Min Wi-Fi (Mbps)" name="min_wifi" type="number" min={0} placeholder="100" value={minWifi} onChange={(e) => setMinWifi(e.target.value)} />
          <Input label="Min desk (1–5)" name="min_desk" type="number" min={1} max={5} placeholder="4" value={minDesk} onChange={(e) => setMinDesk(e.target.value)} />
          <Input label="Max noise (1–5)" name="max_noise" type="number" min={1} max={5} placeholder="3" value={maxNoise} onChange={(e) => setMaxNoise(e.target.value)} />
          <div className="col-span-2 flex items-end gap-2 sm:col-span-3 lg:col-span-5">
            <Button type="submit" size="sm">Apply filters</Button>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Clear
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}