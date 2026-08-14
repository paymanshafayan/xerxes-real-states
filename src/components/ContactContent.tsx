"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useLocale } from "./AppShell";
import { useSiteContent } from "./SiteContentProvider";
import EmailOff from "./EmailOff";

export default function ContactContent() {
  const { dict } = useLocale();
  const { contact_info } = useSiteContent();
  const address = contact_info.address || "Kyrenia Main Street, No. 42\nKyrenia, Northern Cyprus";
  const phone1 = contact_info.phone1 || "+90 533 840 1000";
  const phone2 = contact_info.phone2 || "+90 392 815 1000";
  const email1 = contact_info.email1 || "info@xerxes.com";
  const email2 = contact_info.email2 || "sales@xerxes.com";
  const officeHours = contact_info.office_hours || "Mon - Fri: 09:00 - 18:00, Sat: 10:00 - 15:00";
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {dict.sections.getInTouch}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact Info */}
        <div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{dict.property.location}</h3>
                <p className="text-sm text-gray-600">
                  {address.split("\n").map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{dict.contact.phone}</h3>
                <p className="text-sm text-gray-600">
                  {phone1}<br />
                  {phone2}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{dict.contact.email}</h3>
                <EmailOff>
                  <p className="text-sm text-gray-600">
                    {email1}<br />
                    {email2}
                  </p>
                </EmailOff>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Office Hours</h3>
                <p className="text-sm text-gray-600">
                  {officeHours}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {dict.contact.name}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {dict.contact.email}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {dict.contact.phone}
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {dict.contact.message}
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={5}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "..." : dict.contact.send}
            </button>
            {status === "success" && (
              <p className="text-sm text-success text-center">{dict.contact.success}</p>
            )}
            {status === "error" && (
              <p className="text-sm text-danger text-center">{dict.contact.error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
