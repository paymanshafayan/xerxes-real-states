"use client";

import { useState } from "react";
import { Bell, X, Save, Mail } from "lucide-react";
import { sampleCities } from "@/lib/data/sampleData";
import { useLocale } from "./AppShell";
import { getCityName } from "@/lib/utils";

interface SavedSearchFormProps {
  initialFilters?: {
    type?: string;
    category?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
  };
  onClose: () => void;
}

export default function SavedSearchForm({
  initialFilters = {},
  onClose,
}: SavedSearchFormProps) {
  const { locale, dict } = useLocale();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: initialFilters.type || "",
    category: initialFilters.category || "",
    city: initialFilters.city || "",
    minPrice: initialFilters.minPrice?.toString() || "",
    maxPrice: initialFilters.maxPrice?.toString() || "",
    minBedrooms: initialFilters.minBedrooms?.toString() || "",
    emailNotify: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("auth_token");
    if (!token) {
      alert("Please sign in to save searches");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          filters: {
            type: form.type || undefined,
            category: form.category || undefined,
            city: form.city || undefined,
            minPrice: form.minPrice ? Number(form.minPrice) : undefined,
            maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
            minBedrooms: form.minBedrooms ? Number(form.minBedrooms) : undefined,
          },
          emailNotify: form.emailNotify,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to save search:", error);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Search Saved!
        </h3>
        <p className="text-sm text-gray-500">
          You&apos;ll be notified when new properties match your criteria.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Save This Search</h3>
          <p className="text-xs text-gray-500">
            Get notified when new properties match
          </p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search name (e.g., 'Kyrenia Villas')"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
        >
          <option value="">{dict.property.allTypes}</option>
          <option value="sale">{dict.property.forSale}</option>
          <option value="rent">{dict.property.forRent}</option>
        </select>

        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
        >
          <option value="">{dict.property.allCategories}</option>
          <option value="villa">{dict.property.villa}</option>
          <option value="apartment">{dict.property.apartment}</option>
          <option value="land">{dict.property.land}</option>
          <option value="commercial">{dict.property.commercial}</option>
        </select>
      </div>

      <select
        value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })}
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
      >
        <option value="">{dict.filter.allCities}</option>
        {sampleCities.map((city) => (
          <option key={city.name} value={city.name}>
            {getCityName(city, locale)}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          placeholder={dict.filter.minPrice}
          value={form.minPrice}
          onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
        />
        <input
          type="number"
          placeholder={dict.filter.maxPrice}
          value={form.maxPrice}
          onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
        />
      </div>

      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          checked={form.emailNotify}
          onChange={(e) => setForm({ ...form, emailNotify: e.target.checked })}
          className="w-4 h-4 text-primary rounded"
        />
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Mail className="w-4 h-4 text-gray-400" />
          Email me when new properties match
        </div>
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Search"}
        </button>
      </div>
    </form>
  );
}
