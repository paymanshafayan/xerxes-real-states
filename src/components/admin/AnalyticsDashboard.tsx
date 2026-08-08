"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Home,
  MapPin,
  DollarSign,
  Eye,
  Users,
} from "lucide-react";
import type { SampleProperty } from "@/lib/data/sampleData";

interface AnalyticsData {
  totalProperties: number;
  forSale: number;
  forRent: number;
  byCategory: Record<string, number>;
  byCity: Record<string, number>;
  priceRange: {
    min: number;
    max: number;
    avg: number;
  };
  featured: number;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/properties");
        const json = await res.json();
        const properties: SampleProperty[] = json.properties || [];

        const analytics: AnalyticsData = {
          totalProperties: properties.length,
          forSale: properties.filter((p) => p.type === "sale").length,
          forRent: properties.filter((p) => p.type === "rent").length,
          byCategory: {},
          byCity: {},
          priceRange: {
            min: Math.min(...properties.map((p) => p.price)),
            max: Math.max(...properties.map((p) => p.price)),
            avg:
              properties.reduce((sum, p) => sum + p.price, 0) /
              properties.length,
          },
          featured: properties.filter((p) => p.isFeatured).length,
        };

        properties.forEach((p) => {
          analytics.byCategory[p.category] =
            (analytics.byCategory[p.category] || 0) + 1;
          analytics.byCity[p.city] = (analytics.byCity[p.city] || 0) + 1;
        });

        setData(analytics);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const maxCityCount = Math.max(...Object.values(data.byCity));

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <Home className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{data.totalProperties}</p>
          <p className="text-sm opacity-80">Total Properties</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <DollarSign className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{data.forSale}</p>
          <p className="text-sm opacity-80">For Sale</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
          <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{data.forRent}</p>
          <p className="text-sm opacity-80">For Rent</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <Eye className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">{data.featured}</p>
          <p className="text-sm opacity-80">Featured</p>
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Price Analysis
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Min Price</p>
            <p className="text-xl font-bold text-gray-900">
              £{data.priceRange.min.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-primary-light rounded-lg">
            <p className="text-sm text-gray-500">Avg Price</p>
            <p className="text-xl font-bold text-primary">
              £{Math.round(data.priceRange.avg).toLocaleString()}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Max Price</p>
            <p className="text-xl font-bold text-gray-900">
              £{data.priceRange.max.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* By Category */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Properties by Category
        </h3>
        <div className="space-y-3">
          {Object.entries(data.byCategory).map(([category, count]) => (
            <div key={category} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-24 capitalize">
                {category}
              </span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${(count / data.totalProperties) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* By City */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Properties by City
        </h3>
        <div className="space-y-3">
          {Object.entries(data.byCity)
            .sort((a, b) => b[1] - a[1])
            .map(([city, count]) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 capitalize">
                  {city}
                </span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{
                      width: `${(count / maxCityCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
