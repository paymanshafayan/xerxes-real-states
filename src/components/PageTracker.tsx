"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Generate or get session ID
    let sessionId = sessionStorage.getItem("session_id");
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem("session_id", sessionId);
    }

    // Extract property ID from URL if on property page
    let propertyId: number | undefined;
    const propertyMatch = pathname.match(/\/property\//);
    if (propertyMatch) {
      // Will be tracked with slug, not ID - API handles this
    }

    // Track page view
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        sessionId,
        propertyId,
      }),
    }).catch(() => {
      // Silent fail - analytics should not break the app
    });
  }, [pathname]);

  return null;
}
