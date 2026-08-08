"use client";

import { createContext, useContext } from "react";

export interface SiteContent {
  contact_info: Record<string, string>;
  social: Record<string, string>;
  footer: Record<string, string>;
  about: Record<string, string>;
}

const SiteContentContext = createContext<SiteContent>({
  contact_info: {},
  social: {},
  footer: {},
  about: {},
});

export function SiteContentProvider({
  content,
  children,
}: {
  content: SiteContent;
  children: React.ReactNode;
}) {
  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  );
}

/** Content saved via Admin > Content Manager, with graceful empty defaults. */
export function useSiteContent(): SiteContent {
  return useContext(SiteContentContext);
}
