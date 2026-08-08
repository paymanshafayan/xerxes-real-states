import { http } from "./client";
import type { Property, Agent, PropertyFilters } from "./types";

export async function fetchProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  const params: Record<string, string> = {};
  if (filters.type) params.type = filters.type;
  if (filters.category) params.category = filters.category;
  if (filters.city) params.city = filters.city;
  if (filters.minPrice) params.minPrice = String(filters.minPrice);
  if (filters.maxPrice) params.maxPrice = String(filters.maxPrice);
  if (filters.minBedrooms) params.minBedrooms = String(filters.minBedrooms);
  if (filters.search) params.search = filters.search;
  if (filters.featured) params.featured = "true";
  params.limit = String(filters.limit || 50);

  const res = await http.get<{ properties: Property[] }>("/api/properties", { params });
  return res.data.properties;
}

export async function fetchPropertyById(id: number): Promise<Property> {
  const res = await http.get<{ property: Property }>(`/api/properties/${id}`);
  return res.data.property;
}

export async function fetchPriceDrops(limit = 20): Promise<Property[]> {
  const res = await http.get<{ properties: Property[] }>("/api/properties/price-drops", {
    params: { limit: String(limit) },
  });
  return res.data.properties;
}

export async function fetchAgents(): Promise<Agent[]> {
  const res = await http.get<{ agents: Agent[] }>("/api/agents");
  return res.data.agents;
}

export async function fetchAgentById(id: number): Promise<Agent> {
  const agents = await fetchAgents();
  const agent = agents.find((a) => a.id === id);
  if (!agent) throw new Error("Agent not found");
  return agent;
}

export async function sendInquiry(data: {
  propertyId: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<void> {
  await http.post("/api/inquiries", data);
}
