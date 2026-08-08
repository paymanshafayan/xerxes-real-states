import AppShell from "@/components/AppShell";
import PropertyDetail from "@/components/PropertyDetail";
import { getPropertyBySlug, getAgentById, getProperties } from "@/lib/data/dataProvider";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const agent = property.agentId ? await getAgentById(property.agentId) : null;
  const similar = await getProperties({
    category: property.category,
    city: property.city,
    limit: 4,
  });
  const similarFiltered = similar.filter((p) => p.id !== property.id).slice(0, 3);

  return (
    <AppShell>
      <PropertyDetail
        property={property}
        agent={agent}
        similarProperties={similarFiltered}
      />
    </AppShell>
  );
}
