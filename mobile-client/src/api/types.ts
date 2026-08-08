export interface Property {
  id: number;
  slug: string;
  titleTr: string;
  titleEn: string;
  titleFa: string;
  titleRu: string;
  descriptionTr: string;
  descriptionEn: string;
  descriptionFa: string;
  descriptionRu: string;
  type: "sale" | "rent";
  category: "villa" | "apartment" | "land" | "commercial";
  price: number;
  previousPrice?: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  images: string[];
  features: string[];
  isFeatured: boolean;
  agentId: number;
  createdAt: string;
  panoramas?: string[];
  videos?: string[];
  audioNotes?: string[];
  virtualTourUrl?: string;
}

export interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  photo: string;
  bioTr: string;
  bioEn: string;
  bioFa: string;
  bioRu: string;
}

export interface PropertyFilters {
  type?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  search?: string;
  featured?: boolean;
  limit?: number;
}
