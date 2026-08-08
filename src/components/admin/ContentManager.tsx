"use client";

import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/adminFetch";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Type,
  FileText,
  Phone,
  MapPin,
  Star,
  Loader2,
  CheckCircle,
  X,
  Upload,
  HelpCircle,
} from "lucide-react";

interface ContentSection {
  id: string;
  label: string;
  icon: typeof ImageIcon;
  description: string;
  fields: ContentField[];
}

interface ContentField {
  key: string;
  label: string;
  type: "text" | "textarea" | "image" | "images" | "url" | "color" | "json";
  description: string;
  placeholder?: string;
}

const sections: ContentSection[] = [
  {
    id: "hero_slides",
    label: "Hero Slider Images",
    icon: ImageIcon,
    description: "Images shown in the homepage slider. Add image URLs and alt texts.",
    fields: [
      { key: "slides", label: "Slider Images", type: "json", description: "Array of {image, alt} objects", placeholder: "Managed below" },
    ],
  },
  {
    id: "hero_text",
    label: "Hero Text",
    icon: Type,
    description: "Main title and subtitle on the homepage hero section.",
    fields: [
      { key: "title_en", label: "Title (English)", type: "text", description: "Main heading", placeholder: "Find Your Dream Home..." },
      { key: "title_tr", label: "Title (Türkçe)", type: "text", description: "", placeholder: "Hayalinizdeki Evi Bulun..." },
      { key: "title_fa", label: "Title (فارسی)", type: "text", description: "", placeholder: "خانه رویایی خود را پیدا کنید..." },
      { key: "title_ru", label: "Title (Русский)", type: "text", description: "", placeholder: "Найдите дом мечты..." },
      { key: "subtitle_en", label: "Subtitle (English)", type: "textarea", description: "", placeholder: "Explore premium properties..." },
      { key: "subtitle_tr", label: "Subtitle (Türkçe)", type: "textarea", description: "", placeholder: "" },
      { key: "subtitle_fa", label: "Subtitle (فارسی)", type: "textarea", description: "", placeholder: "" },
      { key: "subtitle_ru", label: "Subtitle (Русский)", type: "textarea", description: "", placeholder: "" },
    ],
  },
  {
    id: "about",
    label: "About Section",
    icon: FileText,
    description: "The 'Why Choose Us' section content on homepage.",
    fields: [
      { key: "reason1_title_en", label: "Reason 1 Title (EN)", type: "text", description: "", placeholder: "Local Expertise" },
      { key: "reason1_desc_en", label: "Reason 1 Desc (EN)", type: "textarea", description: "", placeholder: "" },
      { key: "reason2_title_en", label: "Reason 2 Title (EN)", type: "text", description: "", placeholder: "Verified Properties" },
      { key: "reason2_desc_en", label: "Reason 2 Desc (EN)", type: "textarea", description: "", placeholder: "" },
      { key: "reason3_title_en", label: "Reason 3 Title (EN)", type: "text", description: "", placeholder: "Multilingual Support" },
      { key: "reason3_desc_en", label: "Reason 3 Desc (EN)", type: "textarea", description: "", placeholder: "" },
      { key: "reason4_title_en", label: "Reason 4 Title (EN)", type: "text", description: "", placeholder: "End-to-End Service" },
      { key: "reason4_desc_en", label: "Reason 4 Desc (EN)", type: "textarea", description: "", placeholder: "" },
    ],
  },
  {
    id: "contact_info",
    label: "Contact Information",
    icon: Phone,
    description: "Company address, phone numbers, email displayed on site.",
    fields: [
      { key: "address", label: "Address", type: "textarea", description: "Office address", placeholder: "Kyrenia Main Street..." },
      { key: "phone1", label: "Phone 1", type: "text", description: "Primary phone", placeholder: "+90 533 840 1000" },
      { key: "phone2", label: "Phone 2", type: "text", description: "Secondary phone", placeholder: "+90 392 815 1000" },
      { key: "email1", label: "Email 1", type: "text", description: "Primary email", placeholder: "info@xerxes.com" },
      { key: "email2", label: "Email 2", type: "text", description: "Secondary email", placeholder: "sales@xerxes.com" },
      { key: "office_hours", label: "Office Hours", type: "text", description: "", placeholder: "Mon-Fri: 09:00-18:00" },
      { key: "whatsapp", label: "WhatsApp Number", type: "text", description: "Without + or spaces", placeholder: "905338401000" },
    ],
  },
  {
    id: "social",
    label: "Social Media Links",
    icon: Star,
    description: "Social media profile URLs shown in footer.",
    fields: [
      { key: "facebook", label: "Facebook URL", type: "url", description: "", placeholder: "https://facebook.com/..." },
      { key: "instagram", label: "Instagram URL", type: "url", description: "", placeholder: "https://instagram.com/..." },
      { key: "twitter", label: "Twitter / X URL", type: "url", description: "", placeholder: "https://x.com/..." },
      { key: "linkedin", label: "LinkedIn URL", type: "url", description: "", placeholder: "https://linkedin.com/..." },
      { key: "youtube", label: "YouTube URL", type: "url", description: "", placeholder: "https://youtube.com/..." },
      { key: "telegram", label: "Telegram URL", type: "url", description: "", placeholder: "https://t.me/..." },
    ],
  },
  {
    id: "seo",
    label: "SEO Settings",
    icon: FileText,
    description: "Global SEO meta tags and descriptions.",
    fields: [
      { key: "meta_title", label: "Default Meta Title", type: "text", description: "", placeholder: "Xerxes Real Estate | Northern Cyprus" },
      { key: "meta_description", label: "Default Meta Description", type: "textarea", description: "", placeholder: "Find your dream property..." },
      { key: "og_image", label: "Default OG Image URL", type: "url", description: "Used when sharing on social media", placeholder: "https://..." },
    ],
  },
  {
    id: "footer",
    label: "Footer Content",
    icon: FileText,
    description: "Footer description and copyright text.",
    fields: [
      { key: "description_en", label: "Footer Description (EN)", type: "textarea", description: "", placeholder: "Your trusted partner..." },
      { key: "copyright", label: "Copyright Text", type: "text", description: "", placeholder: "Xerxes Real Estate" },
    ],
  },
];

export default function ContentManager() {
  const [data, setData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ hero_slides: true });

  // Hero slides special state
  const [heroSlides, setHeroSlides] = useState<{ image: string; alt: string }[]>([]);
  const [newSlide, setNewSlide] = useState({ image: "", alt: "" });

  const fetchContent = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/content");
      const d = await res.json();
      setData(d.content || {});
      // Extract hero slides
      if (d.content?.hero_slides?.slides) {
        setHeroSlides(d.content.hero_slides.slides);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateField = (section: string, key: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const saveSection = async (sectionId: string) => {
    setSaving(sectionId);
    const sectionData = data[sectionId] || {};

    try {
      for (const [key, value] of Object.entries(sectionData)) {
        await adminFetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: sectionId, key, value }),
        });
      }
      setSaved(sectionId);
      setTimeout(() => setSaved(null), 2000);
    } catch {}
    setSaving(null);
  };

  const saveHeroSlides = async () => {
    setSaving("hero_slides");
    try {
      await adminFetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "hero_slides", key: "slides", value: heroSlides }),
      });
      setSaved("hero_slides");
      setTimeout(() => setSaved(null), 2000);
    } catch {}
    setSaving(null);
  };

  const addSlide = () => {
    if (!newSlide.image.trim()) return;
    setHeroSlides([...heroSlides, { image: newSlide.image.trim(), alt: newSlide.alt.trim() || "Property image" }]);
    setNewSlide({ image: "", alt: "" });
  };

  const removeSlide = (index: number) => {
    setHeroSlides(heroSlides.filter((_, i) => i !== index));
  };

  const moveSlide = (from: number, to: number) => {
    if (to < 0 || to >= heroSlides.length) return;
    const arr = [...heroSlides];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setHeroSlides(arr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Content Manager</h2>
          <p className="text-sm text-gray-500">Edit static content, images and texts across the site</p>
        </div>
      </div>

      {/* Hero Slides - Special Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection("hero_slides")}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-gray-900">Hero Slider Images</h3>
              <p className="text-xs text-gray-500">{heroSlides.length} slides</p>
            </div>
          </div>
          {openSections.hero_slides ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {openSections.hero_slides && (
          <div className="border-t border-gray-100 p-5 space-y-4">
            {/* Current slides */}
            {heroSlides.map((slide, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-400 font-mono w-6">{i + 1}</span>
                <img src={slide.image} alt={slide.alt} className="w-24 h-14 rounded-lg object-cover border border-gray-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{slide.alt}</p>
                  <p className="text-[10px] text-gray-400 truncate">{slide.image}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveSlide(i, i - 1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↑</button>
                  <button onClick={() => moveSlide(i, i + 1)} disabled={i === heroSlides.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">↓</button>
                  <button onClick={() => removeSlide(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}

            {/* Add new slide */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <input
                type="url"
                placeholder="Image URL"
                value={newSlide.image}
                onChange={(e) => setNewSlide({ ...newSlide, image: e.target.value })}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                placeholder="Alt text"
                value={newSlide.alt}
                onChange={(e) => setNewSlide({ ...newSlide, alt: e.target.value })}
                className="w-40 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <button onClick={addSlide} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"><Plus className="w-4 h-4" /></button>
            </div>

            {/* Save */}
            <button
              onClick={saveHeroSlides}
              disabled={saving === "hero_slides"}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {saving === "hero_slides" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saved === "hero_slides" ? "Saved ✓" : "Save Slides"}
            </button>
          </div>
        )}
      </div>

      {/* Other Sections */}
      {sections.filter((s) => s.id !== "hero_slides").map((section) => (
        <div key={section.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <section.icon className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-gray-900">{section.label}</h3>
                <p className="text-xs text-gray-500">{section.description}</p>
              </div>
            </div>
            {openSections[section.id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {openSections[section.id] && (
            <div className="border-t border-gray-100 p-5 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">{field.label}</label>
                  {field.description && <p className="text-xs text-gray-400 mb-1">{field.description}</p>}
                  {field.type === "textarea" ? (
                    <textarea
                      value={data[section.id]?.[field.key] || ""}
                      onChange={(e) => updateField(section.id, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      dir={field.key.includes("_fa") ? "rtl" : "ltr"}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
                    />
                  ) : (
                    <input
                      type={field.type === "url" ? "url" : field.type === "color" ? "color" : "text"}
                      value={data[section.id]?.[field.key] || ""}
                      onChange={(e) => updateField(section.id, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      dir={field.key.includes("_fa") ? "rtl" : "ltr"}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                    />
                  )}
                </div>
              ))}

              <button
                onClick={() => saveSection(section.id)}
                disabled={saving === section.id}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {saving === section.id ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === section.id ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved === section.id ? "Saved ✓" : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
