"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Trash2, Search, ArrowRight, Plus } from "lucide-react";
import { useLocale } from "./AppShell";
import SavedSearchForm from "./SavedSearchForm";

interface SavedSearch {
  id: number;
  name: string;
  filters: {
    type?: string;
    category?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
  };
  emailNotify: boolean;
  createdAt: string;
}

export default function SavedSearchesContent() {
  const router = useRouter();
  const { locale, dict } = useLocale();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchSearches = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch("/api/saved-searches", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSearches(data.searches || []);
        }
      } catch (error) {
        console.error("Failed to fetch saved searches:", error);
      }
      setLoading(false);
    };

    fetchSearches();
  }, [router]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this saved search?")) return;

    const token = localStorage.getItem("auth_token");
    try {
      await fetch(`/api/saved-searches?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearches(searches.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const buildSearchUrl = (filters: SavedSearch["filters"]) => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.category) params.set("category", filters.category);
    if (filters.city) params.set("city", filters.city);
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.minBedrooms) params.set("minBedrooms", String(filters.minBedrooms));
    return `/properties?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
            <p className="text-sm text-gray-500">
              {searches.length} saved {searches.length === 1 ? "search" : "searches"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4" />
          New Search
        </button>
      </div>

      {searches.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No saved searches</h2>
          <p className="text-gray-500 mb-6">
            Save your search criteria to get notified when new properties match
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark"
          >
            <Plus className="w-4 h-4" />
            Create Your First Search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {searches.map((search) => (
            <div
              key={search.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{search.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {search.filters.type && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                        {search.filters.type === "sale" ? "For Sale" : "For Rent"}
                      </span>
                    )}
                    {search.filters.category && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded capitalize">
                        {search.filters.category}
                      </span>
                    )}
                    {search.filters.city && (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded capitalize">
                        {search.filters.city}
                      </span>
                    )}
                    {search.filters.minPrice && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        Min £{search.filters.minPrice.toLocaleString()}
                      </span>
                    )}
                    {search.filters.maxPrice && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        Max £{search.filters.maxPrice.toLocaleString()}
                      </span>
                    )}
                    {search.filters.minBedrooms && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {search.filters.minBedrooms}+ Beds
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      {search.emailNotify ? (
                        <Bell className="w-3 h-3 text-green-500" />
                      ) : (
                        <Bell className="w-3 h-3 text-gray-300" />
                      )}
                      {search.emailNotify ? "Email alerts on" : "Alerts off"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={buildSearchUrl(search.filters)}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    View Results
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Search Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowForm(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <SavedSearchForm
              onClose={() => {
                setShowForm(false);
                // Refresh searches
                const token = localStorage.getItem("auth_token");
                if (token) {
                  fetch("/api/saved-searches", {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                    .then((res) => res.json())
                    .then((data) => setSearches(data.searches || []));
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
