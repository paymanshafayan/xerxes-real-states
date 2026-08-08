"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import type { SampleProperty } from "@/lib/data/sampleData";
import { sampleCities, featureLabels } from "@/lib/data/sampleData";
import ImageUploader from "@/components/ImageUploader";

interface PropertyFormProps {
  property?: SampleProperty | null;
  onSave: (data: Partial<SampleProperty>) => Promise<void>;
  onCancel: () => void;
}

export default function PropertyForm({ property, onSave, onCancel }: PropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slug: property?.slug || "",
    titleEn: property?.titleEn || "",
    titleTr: property?.titleTr || "",
    titleFa: property?.titleFa || "",
    titleRu: property?.titleRu || "",
    descriptionEn: property?.descriptionEn || "",
    descriptionTr: property?.descriptionTr || "",
    descriptionFa: property?.descriptionFa || "",
    descriptionRu: property?.descriptionRu || "",
    type: property?.type || "sale",
    category: property?.category || "apartment",
    price: property?.price || 0,
    currency: property?.currency || "GBP",
    bedrooms: property?.bedrooms || 0,
    bathrooms: property?.bathrooms || 0,
    area: property?.area || 0,
    city: property?.city || "kyrenia",
    district: property?.district || "",
    address: property?.address || "",
    lat: property?.lat || 35.3,
    lng: property?.lng || 33.3,
    images: property?.images || [],
    features: property?.features || [],
    virtualTourUrl: property?.virtualTourUrl || "",
    isFeatured: property?.isFeatured || false,
    agentId: property?.agentId || 1,
  });

  const [newImageUrl, setNewImageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()],
      });
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const toggleFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.includes(feature)
        ? formData.features.filter((f) => f !== feature)
        : [...formData.features, feature],
    });
  };

  const generateSlug = () => {
    const slug = formData.titleEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setFormData({ ...formData, slug });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {property ? "Edit Property" : "Add New Property"}
          </h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as "sale" | "rent" })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
              >
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as "villa" | "apartment" | "land" | "commercial" })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
              >
                <option value="villa">Villa</option>
                <option value="apartment">Apartment</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
              >
                {sampleCities.map((city) => (
                  <option key={city.name} value={city.name}>{city.nameEn}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Slug (URL)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Titles */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Titles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Title (English)"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                required
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="Başlık (Türkçe)"
                value={formData.titleTr}
                onChange={(e) => setFormData({ ...formData, titleTr: e.target.value })}
                required
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="عنوان (فارسی)"
                value={formData.titleFa}
                onChange={(e) => setFormData({ ...formData, titleFa: e.target.value })}
                required
                dir="rtl"
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="Заголовок (Русский)"
                value={formData.titleRu}
                onChange={(e) => setFormData({ ...formData, titleRu: e.target.value })}
                required
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Descriptions</h3>
            <textarea
              placeholder="Description (English)"
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              required
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
            />
            <textarea
              placeholder="Açıklama (Türkçe)"
              value={formData.descriptionTr}
              onChange={(e) => setFormData({ ...formData, descriptionTr: e.target.value })}
              required
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
            />
            <textarea
              placeholder="توضیحات (فارسی)"
              value={formData.descriptionFa}
              onChange={(e) => setFormData({ ...formData, descriptionFa: e.target.value })}
              required
              rows={2}
              dir="rtl"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
            />
            <textarea
              placeholder="Описание (Русский)"
              value={formData.descriptionRu}
              onChange={(e) => setFormData({ ...formData, descriptionRu: e.target.value })}
              required
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Price & Specs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Price (£)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Bedrooms</label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Bathrooms</label>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Area (m²)</label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Images - Drag & Drop */}
          <ImageUploader
            images={formData.images}
            onImagesChange={(newImages) =>
              setFormData({ ...formData, images: newImages })
            }
            maxFiles={10}
          />

          {/* Virtual Tour */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">
              Virtual Tour URL (Matterport or other 360° embed link)
            </label>
            <input
              type="url"
              placeholder="https://my.matterport.com/show/?m=..."
              value={formData.virtualTourUrl}
              onChange={(e) => setFormData({ ...formData, virtualTourUrl: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Features</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(featureLabels).map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    formData.features.includes(feature)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                  }`}
                >
                  {featureLabels[feature].en}
                </button>
              ))}
            </div>
          </div>

          {/* Featured */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 text-primary rounded"
            />
            <span className="text-sm text-gray-700">Featured Property</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
