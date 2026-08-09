"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Redirects a new installation to the one-time manager setup screen. */
export default function SetupGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/setup") return;
    fetch("/api/setup", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((state) => {
        if (state?.required) router.replace("/setup");
      })
      .catch(() => {
        // Preserve public pages if the database is temporarily unavailable.
      });
  }, [pathname, router]);

  return null;
}
