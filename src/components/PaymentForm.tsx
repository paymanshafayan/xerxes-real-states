"use client";

import { useState } from "react";
import { CreditCard, X, Check, Shield, Lock } from "lucide-react";

interface PaymentFormProps {
  propertyId?: number;
  propertyTitle?: string;
  defaultAmount?: number;
  type: "deposit" | "booking_fee" | "consultation";
  onSuccess?: () => void;
  onClose: () => void;
}

const typeLabels = {
  deposit: { label: "Property Deposit", minAmount: 1000 },
  booking_fee: { label: "Booking Fee", minAmount: 100 },
  consultation: { label: "Consultation Fee", minAmount: 50 },
};

export default function PaymentForm({
  propertyId,
  propertyTitle,
  defaultAmount,
  type,
  onSuccess,
  onClose,
}: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [form, setForm] = useState({
    amount: defaultAmount || typeLabels[type].minAmount,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    paymentMethod: "card",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          amount: form.amount,
          currency: "GBP",
          type,
          paymentMethod: form.paymentMethod,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          notes: form.notes || (propertyTitle ? `For: ${propertyTitle}` : undefined),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.checkoutUrl) {
          // Real Stripe Checkout session — hand off to Stripe's hosted page.
          window.location.href = data.checkoutUrl;
          return;
        }
        setStatus("success");
        onSuccess?.();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900">
              {typeLabels[type].label}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {status === "success" ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Payment Successful!
              </h4>
              <p className="text-sm text-gray-500">
                You will receive a confirmation email shortly.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {propertyTitle && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Property</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {propertyTitle}
                  </p>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Amount (£)
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                  min={typeLabels[type].minAmount}
                  required
                  className="w-full px-4 py-3 text-lg font-bold border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "card", label: "💳 Card" },
                    { value: "bank_transfer", label: "🏦 Bank Transfer" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, paymentMethod: method.value })
                      }
                      className={`py-3 text-sm font-medium rounded-lg border transition-colors ${
                        form.paymentMethod === method.value
                          ? "bg-primary text-white border-primary"
                          : "border-gray-200 text-gray-600 hover:border-primary"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <input
                type="text"
                placeholder="Full Name"
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                required
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />

              {/* Email */}
              <input
                type="email"
                placeholder="Email Address"
                value={form.customerEmail}
                onChange={(e) =>
                  setForm({ ...form, customerEmail: e.target.value })
                }
                required
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />

              {/* Phone */}
              <input
                type="tel"
                placeholder="Phone Number"
                value={form.customerPhone}
                onChange={(e) =>
                  setForm({ ...form, customerPhone: e.target.value })
                }
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />

              {status === "error" && (
                <p className="text-sm text-red-500 text-center">
                  Payment failed. Please try again.
                </p>
              )}

              {/* Security badge */}
              <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                <Lock className="w-3 h-3" />
                <span>Secure payment processing</span>
                <Shield className="w-3 h-3" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay £{form.amount.toLocaleString()}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
