"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { PhotoDTO } from "@/lib/types";

/**
 * PhotoGallery — listing photo carousel (ux-flows.md §4):
 * - main 16:10 photo + thumbnail strip
 * - prev/next buttons (40px touch targets), keyboard: ←/→ navigate, Home/End jump
 * - slide counter "n of N", aria-live announcements
 * - dots per the carousel-* utilities in globals.css
 */
export function PhotoGallery({ photos, name }: { photos: PhotoDTO[]; name: string }) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg border border-neutral-600 bg-surface text-sm text-ink-muted">
        No photos yet
      </div>
    );
  }

  const photo = photos[index];

  return (
    <div
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={`Photos of ${name}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1);
        } else if (e.key === "Home") {
          e.preventDefault();
          go(0);
        } else if (e.key === "End") {
          e.preventDefault();
          go(count - 1);
        }
      }}
      className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-neutral-600">
        <Image
          key={photo.id}
          src={photo.url}
          alt={photo.alt ?? `${name} — photo ${index + 1} of ${count}`}
          fill
          priority={index === 0}
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-cover"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(20_18_17/0.65)] text-ink transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(20_18_17/0.65)] text-ink transition-colors duration-120 ease-out-soft hover:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <p
              aria-live="polite"
              className="absolute bottom-3 right-3 rounded-full bg-[rgb(2_2_2/0.55)] px-2.5 py-1 text-xs text-ink tnum"
            >
              {index + 1} / {count}
            </p>

            {/* dots (carousel-* utilities) */}
            <div className="carousel-dots absolute bottom-3 left-1/2 -translate-x-1/2">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className={`carousel-dot ${i === index ? "carousel-dot-active" : "hover:bg-[rgb(245_240_235/0.7)]"} h-2 rounded-full p-0`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Photo thumbnails">
          {photos.map((p, i) => (
            <li key={p.id} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`relative block size-16 overflow-hidden rounded-md border transition-[border-color] duration-120 ease-out-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
                  i === index ? "border-accent-500" : "border-neutral-600 hover:border-neutral-400"
                }`}
              >
                <Image src={p.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}