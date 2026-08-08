import AppShell from "@/components/AppShell";
import HeroSection from "@/components/HeroSection";
import HomeContent from "@/components/HomeContent";
import TestimonialsSection from "@/components/TestimonialsSection";
import NewsletterPopup from "@/components/NewsletterPopup";
import { getProperties, getAgents } from "@/lib/data/dataProvider";
import { db } from "@/db";
import { staticContent } from "@/db/schema";
import { and, eq } from "drizzle-orm";

async function getHeroSlides(): Promise<{ image: string; alt: string }[] | undefined> {
  try {
    const rows = await db
      .select()
      .from(staticContent)
      .where(and(eq(staticContent.section, "hero_slides"), eq(staticContent.key, "slides")))
      .limit(1);
    if (rows.length > 0) {
      const parsed = JSON.parse(rows[0].value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return undefined;
}

interface HeroTextOverride {
  title?: Partial<Record<"en" | "tr" | "fa" | "ru", string>>;
  subtitle?: Partial<Record<"en" | "tr" | "fa" | "ru", string>>;
}

async function getHeroText(): Promise<HeroTextOverride | undefined> {
  try {
    const rows = await db
      .select()
      .from(staticContent)
      .where(eq(staticContent.section, "hero_text"));
    if (rows.length === 0) return undefined;

    const result: HeroTextOverride = { title: {}, subtitle: {} };
    for (const row of rows) {
      const value = (() => {
        try {
          return JSON.parse(row.value);
        } catch {
          return row.value;
        }
      })();
      if (!value) continue;
      const match = row.key.match(/^(title|subtitle)_(en|tr|fa|ru)$/);
      if (!match) continue;
      const [, field, locale] = match as [string, "title" | "subtitle", "en" | "tr" | "fa" | "ru"];
      result[field]![locale] = value;
    }
    return result;
  } catch {
    return undefined;
  }
}

export default async function HomePage() {
  const [featuredProperties, latestProperties, agents, heroSlides, heroText] = await Promise.all([
    getProperties({ featured: true, limit: 4 }),
    getProperties({ limit: 8 }),
    getAgents(),
    getHeroSlides(),
    getHeroText(),
  ]);

  return (
    <AppShell>
      <HeroSection slides={heroSlides} textOverride={heroText} />
      <HomeContent
        featuredProperties={featuredProperties}
        latestProperties={latestProperties}
        agents={agents}
      />
      <TestimonialsSection />
      <NewsletterPopup />
    </AppShell>
  );
}
