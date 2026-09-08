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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
    ],
  },
};

export default nextConfig;