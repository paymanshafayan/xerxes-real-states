"use client";

import { useState } from "react";
import { X, Save, User } from "lucide-react";
import type { SampleAgent } from "@/lib/data/sampleData";

interface AgentFormProps {
  agent?: SampleAgent | null;
  onSave: (data: Partial<SampleAgent>) => Promise<void>;
  onCancel: () => void;
}

export default function AgentForm({ agent, onSave, onCancel }: AgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    email: agent?.email || "",
    phone: agent?.phone || "",
    photo: agent?.photo || "",
    bioEn: agent?.bioEn || "",
    bioTr: agent?.bioTr || "",
    bioFa: agent?.bioFa || "",
    bioRu: agent?.bioRu || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slide-up">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            {agent ? "Edit Agent" : "Add New Agent"}
          </h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Photo Preview */}
          {formData.photo && (
            <div className="flex justify-center">
              <img
                src={formData.photo}
                alt="Agent"
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
              />
            </div>
          )}

          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />

          <input
            type="url"
            placeholder="Photo URL"
            value={formData.photo}
            onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Bio</h3>
            <textarea
              placeholder="Bio (English)"
              value={formData.bioEn}
              onChange={(e) => setFormData({ ...formData, bioEn: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
            />
            <textarea
              placeholder="Biyografi (Türkçe)"
              value={formData.bioTr}
              onChange={(e) => setFormData({ ...formData, bioTr: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
            />
            <textarea
              placeholder="بیوگرافی (فارسی)"
              value={formData.bioFa}
              onChange={(e) => setFormData({ ...formData, bioFa: e.target.value })}
              rows={2}
              dir="rtl"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
            />
            <textarea
              placeholder="Биография (Русский)"
              value={formData.bioRu}
              onChange={(e) => setFormData({ ...formData, bioRu: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
            />
          </div>

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
              {loading ? "Saving..." : "Save Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
