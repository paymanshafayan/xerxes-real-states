// Patches Next.js's bundled nomodule legacy-polyfill pack down to the
// minimal polyfill-module.js (guarded URL.canParse only).
//
// Why: `next/dist/build/polyfills/polyfill-nomodule.js` is a ~112 KB core-js
// pack meant for pre-ES-module browsers. Next.js 16 (Turbopack) emits it as a
// plain <script src="_next/static/chunks/…"> on every page — no `nomodule`
// attribute — so modern browsers download and execute it even though (a) all
// polyfilled APIs are Baseline 2022 features, native everywhere Next.js
// supports, and (b) browsers old enough to need it cannot execute the app's
// ESM chunks anyway. It is emitted by file path from the Rust runtime, so it
// cannot be intercepted with `turbopack.resolveAlias` like polyfill-module.js
// (see next.config.ts and vercel/next.js#86785).
//
// Runs from `postinstall`. Idempotent and fail-safe: it only rewrites the
// file when it still looks like the stock pack, so a future Next.js version
// that fixes this upstream is left untouched, and any failure just warns.

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const PATCH_MARKER = "xerxes-minimal-polyfill";
// Signature unique to the stock core-js nomodule pack.
const STOCK_SIGNATURE = 'name:"trimStart"';

let target;
try {
  target = require.resolve("next/dist/build/polyfills/polyfill-nomodule.js");
} catch {
  console.warn("[patch-next-polyfills] next polyfill-nomodule.js not found; skipping");
  process.exit(0);
}

let content;
try {
  content = readFileSync(target, "utf8");
} catch (err) {
  console.warn(`[patch-next-polyfills] could not read ${target}: ${err.message}; skipping`);
  process.exit(0);
}

if (content.includes(PATCH_MARKER)) {
  console.log("[patch-next-polyfills] already patched");
  process.exit(0);
}

if (!content.includes(STOCK_SIGNATURE)) {
  // Not the stock pack we know — probably a newer Next.js with a fixed
  // (or differently built) polyfill setup. Leave it alone.
  console.log(
    "[patch-next-polyfills] stock core-js signature not found (Next.js may have fixed this upstream); skipping"
  );
  process.exit(0);
}

const minimal = `// ${PATCH_MARKER}: stock ~112 KB core-js nomodule pack replaced with the
// minimal polyfill (see scripts/patch-next-polyfills.mjs and polyfill-module.js).
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
`;

try {
  writeFileSync(target, minimal, "utf8");
  console.log(`[patch-next-polyfills] patched ${target}`);
} catch (err) {
  console.warn(`[patch-next-polyfills] could not write ${target}: ${err.message}; skipping`);
}
