import type { SampleProperty } from "@/lib/data/sampleData";
import type { Locale } from "@/lib/i18n/types";
import { getPropertyTitle, getPropertyDescription } from "@/lib/utils";

interface PropertySEOProps {
  property: SampleProperty;
  locale: Locale;
  siteUrl: string;
}

export function generatePropertySchema(property: SampleProperty, locale: Locale, siteUrl: string) {
  const title = getPropertyTitle(property, locale);
  const description = getPropertyDescription(property, locale);
  
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: title,
    description: description,
    url: `${siteUrl}/property/${property.slug}`,
    image: property.images[0],
    datePosted: property.createdAt,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency,
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      addressRegion: property.district || "",
      addressCountry: "Northern Cyprus",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: property.lat,
      longitude: property.lng,
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK",
    },
  };
}

export function generateOrganizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Xerxes",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "Your trusted partner for real estate in Northern Cyprus",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kyrenia Main Street",
      addressLocality: "Kyrenia",
      addressCountry: "Northern Cyprus",
    },
    telephone: "+90-533-840-1000",
    email: "info@xerxes.com",
    sameAs: [
      "https://facebook.com/xerxes",
      "https://instagram.com/xerxes",
      "https://twitter.com/xerxes",
    ],
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateWebsiteSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Xerxes",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/properties?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
