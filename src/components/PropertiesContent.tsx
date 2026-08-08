"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, Grid, Map as MapIcon, Bell } from "lucide-react";
import { useLocale } from "./AppShell";
import PropertyCard from "./PropertyCard";
import PropertiesMapView from "./PropertiesMapView";
import SavedSearchForm from "./SavedSearchForm";
import type { SampleProperty } from "@/lib/data/sampleData";
import { sampleCities } from "@/lib/data/sampleData";
import { getCityName } from "@/lib/utils";

interface Filters {
  type: string;
  category: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  search: string;
}

interface PropertiesContentProps {
  properties: SampleProperty[];
  initialFilters: Filters;
}

export default function PropertiesContent({
  properties,
  initialFilters,
}: PropertiesContentProps) {
  const { locale, dict } = useLocale();
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showSaveSearch, setShowSaveSearch] = useState(false);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.category) params.set("category", filters.category);
    if (filters.city) params.set("city", filters.city);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.minBedrooms) params.set("minBedrooms", filters.minBedrooms);
    if (filters.search) params.set("search", filters.search);
    router.push(`/properties?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      category: "",
      city: "",
      minPrice: "",
      maxPrice: "",
      minBedrooms: "",
      search: "",
    });
    router.push("/properties");
  };

  const pageTitle =
    filters.type === "sale"
      ? dict.nav.buy
      : filters.type === "rent"
      ? dict.nav.rent
      : dict.admin.properties;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {properties.length} {dict.admin.properties.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "map"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors md:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {dict.filter.applyFilters}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside
          className={`w-full md:w-64 shrink-0 ${
            showFilters ? "block" : "hidden md:block"
          }`}
        >
          <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">
                <SlidersHorizontal className="w-4 h-4 inline mr-1" />
                {dict.filter.applyFilters}
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="md:hidden text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {dict.filter.type}
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">{dict.property.allTypes}</option>
                  <option value="sale">{dict.property.forSale}</option>
                  <option value="rent">{dict.property.forRent}</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {dict.filter.category}
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">{dict.property.allCategories}</option>
                  <option value="villa">{dict.property.villa}</option>
                  <option value="apartment">{dict.property.apartment}</option>
                  <option value="land">{dict.property.land}</option>
                  <option value="commercial">{dict.property.commercial}</option>
                </select>
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {dict.filter.city}
                </label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">{dict.filter.allCities}</option>
                  {sampleCities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {getCityName(city, locale)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {dict.filter.minPrice}
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {dict.filter.maxPrice}
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  placeholder="1000000"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              {/* Min Bedrooms */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {dict.filter.minBedrooms}
                </label>
                <select
                  value={filters.minBedrooms}
                  onChange={(e) => setFilters({ ...filters, minBedrooms: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">-</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={applyFilters}
                  className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {dict.filter.applyFilters}
                </button>
                <button
                  onClick={clearFilters}
                  className="px-3 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {dict.filter.clearFilters}
                </button>
              </div>
              
              {/* Save Search Button */}
              <button
                onClick={() => setShowSaveSearch(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-3 text-sm text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                <Bell className="w-4 h-4" />
                Save This Search
              </button>
            </div>
          </div>
        </aside>

        {/* Properties Grid/Map */}
        <div className="flex-1">
          {properties.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">{dict.property.noResults}</p>
            </div>
          ) : viewMode === "map" ? (
            <PropertiesMapView properties={properties} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  dict={dict}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSaveSearch(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <SavedSearchForm
              initialFilters={{
                type: filters.type || undefined,
                category: filters.category || undefined,
                city: filters.city || undefined,
                minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
                minBedrooms: filters.minBedrooms ? Number(filters.minBedrooms) : undefined,
              }}
              onClose={() => setShowSaveSearch(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
