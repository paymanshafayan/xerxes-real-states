"use client";

import { useState } from "react";
import { X, Calendar, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface VisitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle: string;
}

export default function VisitRequestModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
}: VisitRequestModalProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    requesterName: "",
    requesterPhone: "",
    requesterEmail: "",
    preferredDate: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setSubmitting(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("ابتدا وارد حساب کاربری خود شوید");
        return;
      }
      const body: any = {
        listingId,
        requesterName: form.requesterName,
        requesterPhone: form.requesterPhone,
        requesterEmail: form.requesterEmail || undefined,
        note: form.note || undefined,
      };
      if (form.preferredDate) {
        body.preferredDate = new Date(form.preferredDate).toISOString();
      }

      const res = await fetch("/api/visit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("درخواست شما ثبت شد. کارشناس مربوطه به زودی با شما تماس خواهد گرفت.");
        onClose();
        router.push("/account/visit-requests");
      } else {
        const data = await res.json();
        setError(data.error || "خطا در ثبت درخواست");
      }
    } catch (err: any) {
      setError(err?.message || "خطا");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            درخواست بازدید
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {listingTitle}
        </p>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              نام و نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.requesterName}
              onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              شماره تماس <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={form.requesterPhone}
              onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">ایمیل (اختیاری)</label>
            <input
              type="email"
              value={form.requesterEmail}
              onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              تاریخ پیشنهادی (اختیاری)
            </label>
            <input
              type="datetime-local"
              value={form.preferredDate}
              onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              یادداشت (اختیاری)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
              placeholder="هر توضیح اضافی..."
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
            >
              {submitting ? "در حال ارسال..." : "ارسال درخواست"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
