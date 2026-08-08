import AppShell from "@/components/AppShell";
import PropertiesContent from "@/components/PropertiesContent";
import { getProperties } from "@/lib/data/dataProvider";

interface Props {
  searchParams: Promise<{
    type?: string;
    category?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    minBedrooms?: string;
    search?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const properties = await getProperties({
    type: params.type,
    category: params.category,
    city: params.city,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    minBedrooms: params.minBedrooms ? Number(params.minBedrooms) : undefined,
    search: params.search,
    limit: 50,
  });

  return (
    <AppShell>
      <PropertiesContent
        properties={properties}
        initialFilters={{
          type: params.type || "",
          category: params.category || "",
          city: params.city || "",
          minPrice: params.minPrice || "",
          maxPrice: params.maxPrice || "",
          minBedrooms: params.minBedrooms || "",
          search: params.search || "",
        }}
      />
    </AppShell>
  );
}
