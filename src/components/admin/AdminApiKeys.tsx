"use client";

import { useState, useEffect } from "react";
import { Key, Save, Eye, EyeOff, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { adminFetch } from "@/lib/adminFetch";

interface ApiKeyConfig {
  id: string;
  label: string;
  envKey: string;
  placeholder: string;
  description: string;
  docsUrl: string;
  category: string;
}

const apiKeyConfigs: ApiKeyConfig[] = [
  {
    id: "ga",
    label: "Google Analytics",
    envKey: "NEXT_PUBLIC_GA_ID",
    placeholder: "G-XXXXXXXXXX",
    description: "Google Analytics 4 Measurement ID for visitor tracking and page view analytics.",
    docsUrl: "https://support.google.com/analytics/answer/9539598",
    category: "Analytics",
  },
  {
    id: "smtp_host",
    label: "SMTP Host",
    envKey: "SMTP_HOST",
    placeholder: "smtp.gmail.com",
    description: "SMTP server hostname for sending emails (newsletters, confirmations).",
    docsUrl: "https://nodemailer.com/smtp/",
    category: "Email",
  },
  {
    id: "smtp_port",
    label: "SMTP Port",
    envKey: "SMTP_PORT",
    placeholder: "587",
    description: "SMTP server port. Common: 587 (TLS), 465 (SSL), 25 (unencrypted).",
    docsUrl: "https://nodemailer.com/smtp/",
    category: "Email",
  },
  {
    id: "smtp_user",
    label: "SMTP Username",
    envKey: "SMTP_USER",
    placeholder: "your@email.com",
    description: "SMTP authentication username, usually your email address.",
    docsUrl: "https://nodemailer.com/smtp/",
    category: "Email",
  },
  {
    id: "smtp_pass",
    label: "SMTP Password",
    envKey: "SMTP_PASS",
    placeholder: "••••••••",
    description: "SMTP authentication password or app-specific password.",
    docsUrl: "https://nodemailer.com/smtp/",
    category: "Email",
  },
  {
    id: "smtp_from",
    label: "Email From Address",
    envKey: "SMTP_FROM",
    placeholder: "noreply@xerxes.com",
    description: "The 'From' address used when sending emails.",
    docsUrl: "https://nodemailer.com/smtp/",
    category: "Email",
  },
  {
    id: "stripe_pk",
    label: "Stripe Public Key",
    envKey: "NEXT_PUBLIC_STRIPE_PK",
    placeholder: "pk_live_...",
    description: "Stripe publishable key for client-side payment processing.",
    docsUrl: "https://stripe.com/docs/keys",
    category: "Payments",
  },
  {
    id: "stripe_sk",
    label: "Stripe Secret Key",
    envKey: "STRIPE_SECRET_KEY",
    placeholder: "sk_live_...",
    description: "Stripe secret key for server-side payment operations. Keep this private!",
    docsUrl: "https://stripe.com/docs/keys",
    category: "Payments",
  },
  {
    id: "matterport",
    label: "Matterport API Key",
    envKey: "MATTERPORT_API_KEY",
    placeholder: "xxxxxxxxxxxxxxxx",
    description: "Matterport SDK key for embedding 3D virtual property tours.",
    docsUrl: "https://matterport.com/developers",
    category: "Virtual Tours",
  },
];

export default function AdminApiKeys() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved values from DB
  useEffect(() => {
    adminFetch("/api/admin/api-keys")
      .then((res) => res.json())
      .then((data) => {
        if (data.keys) setValues(data.keys);
      })
      .catch(() => {});
  }, []);

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await adminFetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: values }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save API keys:", error);
    }
    setLoading(false);
  };

  // Group by category
  const categories = Array.from(new Set(apiKeyConfigs.map((c) => c.category)));

  return (
    <div className="max-w-3xl space-y-6">
      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-800 text-sm">Security Notice</h3>
          <p className="text-xs text-amber-700 mt-1">
            API keys are stored in the database. In production, use environment variables directly on your server. 
            Never expose secret keys to the client-side. Keys marked as NEXT_PUBLIC_ are safe for client use.
          </p>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Key className="w-4 h-4" />
              {category}
            </h3>
          </div>

          <div className="p-6 space-y-5">
            {apiKeyConfigs
              .filter((c) => c.category === category)
              .map((config) => (
                <div key={config.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      {config.label}
                    </label>
                    <a
                      href={config.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Docs
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={visibleKeys[config.id] ? "text" : "password"}
                        value={values[config.envKey] || ""}
                        onChange={(e) =>
                          setValues({ ...values, [config.envKey]: e.target.value })
                        }
                        placeholder={config.placeholder}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleVisibility(config.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {visibleKeys[config.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    <code className="bg-gray-100 px-1 rounded text-[10px]">{config.envKey}</code>{" "}
                    — {config.description}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save All Keys"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            Saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}
