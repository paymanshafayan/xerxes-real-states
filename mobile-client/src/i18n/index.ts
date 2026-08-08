import { I18n } from "i18n-js";
import { translations, type Locale, RTL_LOCALES } from "./strings";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const i18n = new I18n(translations);
i18n.defaultLocale = "fa";
i18n.locale = "fa";
i18n.enableFallback = true;

export const STORAGE_KEY = "xerxes-client.locale";

export async function initI18n(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) i18n.locale = saved as Locale;
  } catch {
    /* ignore */
  }
}

export function setLocale(locale: Locale): void {
  i18n.locale = locale;
  AsyncStorage.setItem(STORAGE_KEY, locale).catch(() => {});
}

export function isRTL(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}

export function t(key: string): string {
  return i18n.t(key);
}
