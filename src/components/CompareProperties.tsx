"use client";

import { useState, useEffect } from "react";
import { X, Check, Scale, Plus, Trash2 } from "lucide-react";
import type { SampleProperty } from "@/lib/data/sampleData";
import { featureLabels } from "@/lib/data/sampleData";
import { useLocale } from "./AppShell";
import { getPropertyTitle, formatPrice } from "@/lib/utils";

const STORAGE_KEY = "xerxes_compare";

export function getCompareList(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToCompare(id: number): number[] {
  const list = getCompareList();
  if (!list.includes(id) && list.length < 4) {
    list.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  return list;
}

export function removeFromCompare(id: number): number[] {
  const list = getCompareList().filter((i) => i !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

export function isInCompare(id: number): boolean {
  return getCompareList().includes(id);
}

export function clearCompare(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Compare Button for Property Card
export function CompareButton({ propertyId }: { propertyId: number }) {
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    setInCompare(isInCompare(propertyId));
  }, [propertyId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(propertyId);
      setInCompare(false);
    } else {
      addToCompare(propertyId);
      setInCompare(true);
    }
    // Dispatch storage event for other components
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
        inCompare
          ? "bg-primary text-white"
          : "bg-white/90 text-gray-600 hover:bg-white"
      }`}
      title={inCompare ? "Remove from compare" : "Add to compare"}
    >
      <Scale className="w-3 h-3" />
      {inCompare ? "Added" : "Compare"}
    </button>
  );
}

// Floating Compare Bar
export function CompareFloatingBar() {
  const { locale, dict } = useLocale();
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [properties, setProperties] = useState<SampleProperty[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const update = () => {
      const ids = getCompareList();
      setCompareIds(ids);
    };
    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  useEffect(() => {
    if (compareIds.length > 0) {
      fetch("/api/properties")
        .then((res) => res.json())
        .then((data) => {
          const props = (data.properties || []).filter((p: SampleProperty) =>
            compareIds.includes(p.id)
          );
          setProperties(props);
        });
    } else {
      setProperties([]);
    }
  }, [compareIds]);

  const handleRemove = (id: number) => {
    removeFromCompare(id);
    setCompareIds(getCompareList());
    window.dispatchEvent(new Event("storage"));
  };

  const handleClear = () => {
    clearCompare();
    setCompareIds([]);
    setProperties([]);
    window.dispatchEvent(new Event("storage"));
  };

  if (compareIds.length === 0) return null;

  return (
    <>
      {/* Floating Bar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 flex items-center gap-3 animate-slide-up">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-gray-700">
            {compareIds.length} Properties
          </span>
        </div>
        <div className="flex -space-x-2">
          {properties.slice(0, 4).map((p) => (
            <img
              key={p.id}
              src={p.images[0]}
              alt=""
              className="w-10 h-10 rounded-lg border-2 border-white object-cover"
            />
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark"
        >
          Compare Now
        </button>
        <button
          onClick={handleClear}
          className="p-2 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Compare Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Compare Properties
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-gray-50 rounded-l-lg font-semibold text-gray-700 w-40">
                      Property
                    </th>
                    {properties.map((p) => (
                      <th key={p.id} className="p-3 bg-gray-50 text-center">
                        <div className="relative inline-block">
                          <img
                            src={p.images[0]}
                            alt=""
                            className="w-32 h-20 rounded-lg object-cover mx-auto mb-2"
                          />
                          <button
                            onClick={() => handleRemove(p.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {getPropertyTitle(p, locale)}
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-3 text-sm text-gray-600">Price</td>
                    {properties.map((p) => (
                      <td
                        key={p.id}
                        className="p-3 text-center text-lg font-bold text-primary"
                      >
                        {formatPrice(p.price, p.currency, p.type, locale)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">Type</td>
                    {properties.map((p) => (
                      <td key={p.id} className="p-3 text-center text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            p.type === "sale"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {p.type === "sale" ? "For Sale" : "For Rent"}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">Category</td>
                    {properties.map((p) => (
                      <td
                        key={p.id}
                        className="p-3 text-center text-sm capitalize"
                      >
                        {p.category}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">Bedrooms</td>
                    {properties.map((p) => (
                      <td
                        key={p.id}
                        className="p-3 text-center text-sm font-semibold"
                      >
                        {p.bedrooms}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">Bathrooms</td>
                    {properties.map((p) => (
                      <td
                        key={p.id}
                        className="p-3 text-center text-sm font-semibold"
                      >
                        {p.bathrooms}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">Area</td>
                    {properties.map((p) => (
                      <td
                        key={p.id}
                        className="p-3 text-center text-sm font-semibold"
                      >
                        {p.area} m²
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">City</td>
                    {properties.map((p) => (
                      <td
                        key={p.id}
                        className="p-3 text-center text-sm capitalize"
                      >
                        {p.city}
                      </td>
                    ))}
                  </tr>
                  {/* Features */}
                  {Object.keys(featureLabels)
                    .slice(0, 10)
                    .map((feature) => (
                      <tr key={feature}>
                        <td className="p-3 text-sm text-gray-600">
                          {featureLabels[feature].en}
                        </td>
                        {properties.map((p) => (
                          <td key={p.id} className="p-3 text-center">
                            {p.features.includes(feature) ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
