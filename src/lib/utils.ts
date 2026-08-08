import type { Locale } from "./i18n/types";
import type { SampleProperty, SampleAgent } from "./data/sampleData";

export function getPropertyTitle(property: SampleProperty, locale: Locale): string {
  switch (locale) {
    case "tr": return property.titleTr;
    case "fa": return property.titleFa;
    case "ru": return property.titleRu;
    default: return property.titleEn;
  }
}

export function getPropertyDescription(property: SampleProperty, locale: Locale): string {
  switch (locale) {
    case "tr": return property.descriptionTr;
    case "fa": return property.descriptionFa;
    case "ru": return property.descriptionRu;
    default: return property.descriptionEn;
  }
}

export function getAgentBio(agent: SampleAgent, locale: Locale): string {
  switch (locale) {
    case "tr": return agent.bioTr;
    case "fa": return agent.bioFa;
    case "ru": return agent.bioRu;
    default: return agent.bioEn;
  }
}

export function formatPrice(price: number, currency: string, type: string, locale: Locale): string {
  const formatted = new Intl.NumberFormat("en-US").format(price);
  const suffix = type === "rent" ? (locale === "fa" ? "/ماهانه" : locale === "tr" ? "/ay" : locale === "ru" ? "/мес" : "/mo") : "";
  return `£${formatted}${suffix}`;
}

export function getCityName(city: { nameTr: string; nameEn: string; nameFa: string; nameRu: string }, locale: Locale): string {
  switch (locale) {
    case "tr": return city.nameTr;
    case "fa": return city.nameFa;
    case "ru": return city.nameRu;
    default: return city.nameEn;
  }
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
