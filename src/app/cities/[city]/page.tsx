import AppShell from "@/components/AppShell";
import CityContent from "@/components/CityContent";
import { getProperties } from "@/lib/data/dataProvider";
import { sampleCities } from "@/lib/data/sampleData";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { generatePropertySchema, generateWebsiteSchema } from "@/components/SEO";

interface Props {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ type?: string; category?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const cityData = sampleCities.find((c) => c.name === city);
  const cityName = cityData?.nameEn || city;

  return {
    title: `Properties in ${cityName} | Northern Cyprus Real Estate`,
    description: `Browse ${cityName} properties for sale and rent. Find villas, apartments, land and commercial properties in ${cityName}, Northern Cyprus.`,
    alternates: {
      canonical: `/cities/${city}`,
    },
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const { city } = await params;
  const search = await searchParams;
  const cityData = sampleCities.find((c) => c.name === city);

  if (!cityData) {
    notFound();
  }

  const properties = await getProperties({
    city,
    type: search.type,
    category: search.category,
    limit: 50,
  });

  return (
    <AppShell>
      <CityContent cityData={cityData} properties={properties} />
    </AppShell>
  );
}
