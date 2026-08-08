"use client";

import Link from "next/link";
import { Bed, Bath, Maximize, MapPin } from "lucide-react";
import type { SampleProperty } from "@/lib/data/sampleData";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/types";
import { getPropertyTitle, formatPrice } from "@/lib/utils";
import { sampleCities } from "@/lib/data/sampleData";
import { getCityName } from "@/lib/utils";
import FavoriteButton from "./FavoriteButton";
import { CompareButton } from "./CompareProperties";
import OptimizedImage from "./OptimizedImage";

interface PropertyCardProps {
  property: SampleProperty;
  dict: Dictionary;
  locale: Locale;
}

export default function PropertyCard({ property, dict, locale }: PropertyCardProps) {
  const title = getPropertyTitle(property, locale);
  const price = formatPrice(property.price, property.currency, property.type, locale);
  const cityData = sampleCities.find((c) => c.name === property.city);
  const cityLabel = cityData ? getCityName(cityData, locale) : property.city;

  const typeLabel = property.type === "sale" ? dict.property.forSale : dict.property.forRent;
  const categoryLabel =
    property.category === "villa"
      ? dict.property.villa
      : property.category === "apartment"
      ? dict.property.apartment
      : property.category === "land"
      ? dict.property.land
      : dict.property.commercial;

  return (
    <Link href={`/property/${property.slug}`}>
      <div className="property-card bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer">
        {/* Image */}
        <div className="img-container relative h-52">
          <OptimizedImage
            src={property.images[0]}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold text-white ${
                property.type === "sale" ? "bg-primary" : "bg-accent"
              }`}
            >
              {typeLabel}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-gray-800/70 backdrop-blur-sm">
              {categoryLabel}
            </span>
          </div>
          {/* Favorite & Compare Buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            <FavoriteButton propertyId={property.id} size="sm" />
            <CompareButton propertyId={property.id} />
          </div>
          {property.isFeatured && (
            <span className="absolute top-3 left-24 px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-accent">
              ⭐ {dict.property.featured}
            </span>
          )}
          {/* Price overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
            <span className="text-white text-lg font-bold">{price}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{cityLabel}{property.district ? `, ${property.district}` : ""}</span>
          </div>
          {/* Stats */}
          {property.category !== "land" && (
            <div className="flex items-center gap-4 text-gray-600 text-xs border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" />
                <span>{property.bedrooms} {dict.property.bedrooms}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5" />
                <span>{property.bathrooms} {dict.property.bathrooms}</span>
              </div>
              <div className="flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5" />
                <span>{property.area} {dict.property.sqm}</span>
              </div>
            </div>
          )}
          {property.category === "land" && (
            <div className="flex items-center gap-1 text-gray-600 text-xs border-t border-gray-100 pt-3">
              <Maximize className="w-3.5 h-3.5" />
              <span>{property.area} {dict.property.sqm}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
