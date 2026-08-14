import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
    // Inline the (small, ~14 KiB gzip) global CSS into the HTML instead of a
    // render-blocking <link rel="stylesheet">. Removes the only render
    // blocking request Lighthouse flags and shaves a round trip off FCP/LCP.
    // Trade-off: CSS is re-downloaded inside every page's HTML rather than
    // cached once — acceptable at this size.
    inlineCss: true,
  },
  turbopack: {
    resolveAlias: {
      // Replace Next.js's unconditional legacy-polyfill bundles with our
      // minimal one (only URL.canParse remains). Every other API they
      // polyfill is Baseline 2022, i.e. native on all of Next.js's own
      // supported browsers — see vercel/next.js#86785 and ./polyfill-module.js.
      // The "nomodule" bundle targets pre-ES-module browsers, which cannot
      // execute any of the ESM app code anyway.
      "../build/polyfills/polyfill-module": "./polyfill-module.js",
      "next/dist/build/polyfills/polyfill-module": "./polyfill-module.js",
      "../build/polyfills/polyfill-nomodule": "./polyfill-module.js",
      "next/dist/build/polyfills/polyfill-nomodule": "./polyfill-module.js",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 60 — full-viewport hero slides (sit behind a dark gradient overlay);
    // 70 — small decorative thumbnails (city cards); 75 — default.
    qualities: [60, 70, 75],
    // Floor for /_next/image responses (remote CDNs like Pexels already
    // send longer upstream TTLs, which take precedence). Optimized URLs are
    // content-addressed by src+params, so a day of caching is safe.
    minimumCacheTTL: 86400,
  },
  // Files in /public are served with `max-age=0` by default, which makes
  // browsers (and Cloudflare) revalidate or re-download them on every
  // visit. Give brand/static assets an explicit 30-day lifetime instead.
  // If any of these files change, bump its filename or let it expire.
  async headers() {
    const longLived = {
      key: "Cache-Control",
      value: "public, max-age=2592000, must-revalidate",
    };
    return [
      { source: "/favicon.ico", headers: [longLived] },
      { source: "/favicon.png", headers: [longLived] },
      { source: "/logo-64.webp", headers: [longLived] },
      { source: "/logo-128.webp", headers: [longLived] },
      { source: "/icons/:path*", headers: [longLived] },
      { source: "/screenshots/:path*", headers: [longLived] },
    ];
  },
};

export default nextConfig;
