export type Locale = "en" | "tr" | "fa" | "ru";

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  flag: string;
}

export const locales: LocaleConfig[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr", flag: "🇬🇧" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl", flag: "🇮🇷" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", flag: "🇷🇺" },
];

export const defaultLocale: Locale = "en";

export function getLocaleConfig(locale: Locale): LocaleConfig {
  return locales.find((l) => l.code === locale) || locales[0];
}

export function isRtl(locale: Locale): boolean {
  return getLocaleConfig(locale).dir === "rtl";
}
