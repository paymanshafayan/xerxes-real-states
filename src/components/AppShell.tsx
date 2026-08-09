"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import type { Locale } from "@/lib/i18n/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isRtl } from "@/lib/i18n/types";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";
import LiveChat from "./LiveChat";
import { CompareFloatingBar } from "./CompareProperties";
import { CurrencyProvider } from "./CurrencyConverter";
import ClientAppButton from "./ClientAppButton";
import ServiceWorkerRegister from "./ServiceWorkerRegister";
import PageTracker from "./PageTracker";
import { useSiteContent } from "./SiteContentProvider";

interface LocaleContextType {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  dict: getDictionary("en"),
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { contact_info } = useSiteContent();
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dict, setDict] = useState<Dictionary>(getDictionary("en"));

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setDict(getDictionary(newLocale));
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
    }
    // Update HTML dir and lang
    document.documentElement.dir = isRtl(newLocale) ? "rtl" : "ltr";
    document.documentElement.lang = newLocale;
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale") as Locale | null;
      if (saved && ["en", "tr", "fa", "ru"].includes(saved)) {
        setLocale(saved);
      }
    }
  }, [setLocale]);

  return (
    <LocaleContext.Provider value={{ locale, dict, setLocale }}>
      <CurrencyProvider>
        <Header dict={dict} locale={locale} onLocaleChange={setLocale} />
        <main className="min-h-[calc(100vh-200px)]">{children}</main>
        <Footer dict={dict} />
        <WhatsAppButton phone={contact_info.whatsapp || undefined} />
        <LiveChat />
        <CompareFloatingBar />
        <ClientAppButton />
        <ServiceWorkerRegister />
        <PageTracker />
      </CurrencyProvider>
    </LocaleContext.Provider>
  );
}
