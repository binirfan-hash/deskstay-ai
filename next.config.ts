import type { NextConfig } from "next";

/**
 * Listing photos are remote by contract (collab/contract-amendments.md A3):
 * seeded rows use picsum.photos placeholders; host uploads use Supabase
 * Storage public URLs on the configured project host. Both must be allowed
 * or next/image throws at runtime.
 */
const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined; // set at build/dev time via .env.local
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  // 18 Nov 2026 (Nadeem approved): static export for the free-host demo.
  output: "export",
  // GitHub Pages project site: every asset lives under /deskstay-demo/.
  basePath: "/deskstay-demo",
  images: {
    // v2 demo mode (16 Nov 2026, Nadeem approved): serve photos straight from
    // Supabase/picsum CDNs. The Vercel image-optimizer function was the single
    // biggest Fluid Active-CPU burner on the Hobby free tier (120 photos x
    // bot crawls); optimizing here is pointless for a demo app.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
    ],
  },
};

export default nextConfig;