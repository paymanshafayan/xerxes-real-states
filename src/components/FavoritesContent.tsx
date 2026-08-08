"use client";

import { useState, useEffect } from "react";
import { Heart, Trash2 } from "lucide-react";
import { useLocale } from "./AppShell";
import PropertyCard from "./PropertyCard";
import { getFavorites, clearFavorites } from "@/lib/favorites";
import type { SampleProperty } from "@/lib/data/sampleData";

export default function FavoritesContent() {
  const { locale, dict } = useLocale();
  const [properties, setProperties] = useState<SampleProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      const favoriteIds = getFavorites();
      if (favoriteIds.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/properties");
        const data = await res.json();
        const allProperties: SampleProperty[] = data.properties || [];
        const favoriteProperties = allProperties.filter((p) =>
          favoriteIds.includes(p.id)
        );
        setProperties(favoriteProperties);
      } catch (error) {
        console.error("Failed to load favorites:", error);
      }
      setLoading(false);
    };

    loadFavorites();
  }, []);

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all favorites?")) {
      clearFavorites();
      setProperties([]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-72 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {locale === "fa" ? "علاقه‌مندی‌ها" : 
               locale === "tr" ? "Favorilerim" :
               locale === "ru" ? "Избранное" : "My Favorites"}
            </h1>
            <p className="text-sm text-gray-500">
              {properties.length}{" "}
              {locale === "fa" ? "ملک ذخیره شده" :
               locale === "tr" ? "kayıtlı mülk" :
               locale === "ru" ? "сохраненных объектов" : "saved properties"}
            </p>
          </div>
        </div>
        {properties.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {locale === "fa" ? "حذف همه" :
             locale === "tr" ? "Tümünü Sil" :
             locale === "ru" ? "Очистить все" : "Clear All"}
          </button>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {locale === "fa" ? "هنوز ملکی ذخیره نکرده‌اید" :
             locale === "tr" ? "Henüz kayıtlı mülkünüz yok" :
             locale === "ru" ? "У вас пока нет избранных" : "No favorites yet"}
          </h2>
          <p className="text-gray-500 mb-6">
            {locale === "fa" ? "برای ذخیره ملک روی دکمه قلب کلیک کنید" :
             locale === "tr" ? "Mülkleri kaydetmek için kalp simgesine tıklayın" :
             locale === "ru" ? "Нажмите на сердечко, чтобы сохранить объект" : 
             "Click the heart icon on properties to save them"}
          </p>
          <a
            href="/properties"
            className="inline-flex px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
          >
            {dict.nav.search} {dict.admin.properties}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
  );
}
