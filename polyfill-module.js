// Minimal replacement for Next.js's unconditional legacy-polyfill bundles:
// `next/dist/build/polyfills/polyfill-module.js` and `polyfill-nomodule.js`.
//
// Next.js always bundles guarded polyfills for Array.prototype.at/flat/flatMap,
// Object.fromEntries, Object.hasOwn, String.prototype.trimStart/trimEnd,
// Symbol.prototype.description, Promise.prototype.finally, and (in the
// nomodule variant) a ~112 KB core-js pack — regardless of configured browser
// targets (see vercel/next.js#86785). All of those are Baseline features on
// every browser in Next.js's own supported-browsers list (Chrome 111+,
// Edge 111+, Firefox 111+, Safari 16.4+), and the nomodule pack targets
// pre-ES-module browsers that cannot execute the app's ESM output at all —
// so they are dead bytes flagged by Lighthouse's "Legacy JavaScript" audit.
//
// URL.canParse is the exception: it only became Baseline in 2023
// (Chrome 120, Firefox 115, Safari 17), newer than Next.js's supported floor
// (Safari 16.4), so we keep just that one guarded polyfill.
//
// Aliased in place of the stock modules via `turbopack.resolveAlias` in
// next.config.ts.
"use strict";

if (!("canParse" in URL)) {
  URL.canParse = function canParse(url, base) {
    try {
      return !!new URL(url, base);
    } catch {
      return false;
    }
  };
}
