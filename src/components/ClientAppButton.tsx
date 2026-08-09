"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { useLocale } from "./AppShell";

/** Public customer-app entry point. Kept separate from the browser's native PWA install flow. */
export default function ClientAppButton() {
  const { dict } = useLocale();
  return <Link href="/app" className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-lg shadow-gray-900/10 hover:border-primary hover:text-primary transition-colors" aria-label={dict.nav.app}>
    <Smartphone className="w-4 h-4" />{dict.nav.app}
  </Link>;
}
