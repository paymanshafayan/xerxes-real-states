import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n } from "../i18n";
import type { Locale } from "../i18n/strings";

const STORAGE_KEY = "xerxes-client.locale";

interface LocaleState {
  locale: Locale;
  ready: boolean;
  init: () => Promise<void>;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "fa",
  ready: false,
  init: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const locale = (saved as Locale) || "fa";
      i18n.locale = locale;
      set({ locale, ready: true });
    } catch {
      set({ ready: true });
    }
  },
  setLocale: (locale: Locale) => {
    i18n.locale = locale;
    AsyncStorage.setItem(STORAGE_KEY, locale).catch(() => {});
    set({ locale });
  },
}));

/**
 * Reactive translation hook — re-renders the component when the locale
 * changes (the plain `t()` export from `src/i18n` does NOT trigger
 * re-renders on its own since i18n.locale is a mutable module variable,
 * not React state).
 */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return (key: string) => i18n.t(key, { locale });
}
