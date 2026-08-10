"use client";

import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import { Calendar, Phone, AlertCircle, CheckCircle, X } from "lucide-react";

interface VisitRequest {
  visitRequest: any;
  listing: { id: number; title: string; city: string; images: string[] };
  requester: { id: number; name: string; email: string; phone: string };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  staff_reviewing: "در حال بررسی",
  owner_contacted: "تماس با مالک",
  approved: "تایید شده",
  rejected: "رد شده",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  staff_reviewing: "bg-blue-100 text-blue-800",
  owner_contacted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function StaffVisitRequestsManager() {
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [activeAction, setActiveAction] = useState<number | null>(null);
  const [contactNote, setContactNote] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = status
        ? `/api/staff/visit-requests?status=${status}&limit=100`
        : "/api/staff/visit-requests?limit=100";
      const res = await adminFetch(url);
      const data = await res.json();
      setRequests(data.visitRequests || []);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [status]);

  const review = async (id: number) => {
    await adminFetch(`/api/staff/visit-requests/${id}/review`, { method: "POST" });
    fetchRequests();
  };

  const contactOwner = async (id: number, response: string) => {
    if (!confirm(`صاحب ملک ${response === "available" ? "در دسترس است" : response === "unavailable" ? "در دسترس نیست" : "پاسخ نداد"}?`)) {
      return;
    }
    try {
      const res = await adminFetch(`/api/staff/visit-requests/${id}/contact-owner`, {
        method: "POST",
        body: JSON.stringify({ ownerResponse: response, note: contactNote }),
      });
      const data = await res.json();
      if (data.action === "blocked") {
        alert("گزارش عدم موجودیت ثبت و حساب کاربر بلاک شد.");
      } else {
        alert("نتیجه ثبت شد");
      }
      setActiveAction(null);
      setContactNote("");
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || "خطا");
    }
  };

  const schedule = async (id: number) => {
    if (!appointmentDate) {
      alert("لطفاً تاریخ و زمان بازدید را انتخاب کنید");
      return;
    }
    try {
      await adminFetch(`/api/staff/visit-requests/${id}/schedule`, {
        method: "POST",
        body: JSON.stringify({ appointmentDate: new Date(appointmentDate).toISOString() }),
      });
      alert("زمان بازدید تنظیم شد");
      setActiveAction(null);
      setAppointmentDate("");
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || "خطا");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">درخواست‌های بازدید</h2>
          <p className="text-sm text-gray-500">{requests.length} مورد</p>
        </div>
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="mb-4 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
      >
        <option value="">همه وضعیت‌ها</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">درخواستی نیست</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((row) => {
            const r = row.visitRequest;
            return (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                    <img
                      src={(row.listing.images as string[])?.[0] || "/placeholder.jpg"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {row.listing.title}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          STATUS_COLORS[r.status]
                        }`}
                      >
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {row.listing.city} • متقاضی: {row.requester.name}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {row.requester.phone}
                      </span>
                      {row.requester.email && <span>{row.requester.email}</span>}
                    </div>

                    {/* Action panel */}
                    {activeAction === r.id ? (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                        {r.status === "pending" && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => contactOwner(r.id, "available")}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg"
                            >
                              ✓ موجود است
                            </button>
                            <button
                              onClick={() => contactOwner(r.id, "unavailable")}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg"
                            >
                              ✗ موجود نیست (بلاک)
                            </button>
                            <button
                              onClick={() => contactOwner(r.id, "no_response")}
                              className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg"
                            >
                              بی‌پاسخ
                            </button>
                          </div>
                        )}
                        {r.status === "approved" && (
                          <div className="flex gap-2 items-end">
                            <input
                              type="datetime-local"
                              value={appointmentDate}
                              onChange={(e) => setAppointmentDate(e.target.value)}
                              className="px-2 py-1.5 border rounded-lg text-xs"
                            />
                            <button
                              onClick={() => schedule(r.id)}
                              className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg"
                            >
                              تنظیم زمان
                            </button>
                          </div>
                        )}
                        <textarea
                          value={contactNote}
                          onChange={(e) => setContactNote(e.target.value)}
                          placeholder="یادداشت (اختیاری)"
                          rows={2}
                          className="w-full px-2 py-1.5 border rounded-lg text-xs"
                        />
                        <button
                          onClick={() => setActiveAction(null)}
                          className="text-xs text-gray-500"
                        >
                          بستن
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        {r.status === "pending" && (
                          <button
                            onClick={() => review(r.id)}
                            className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg"
                          >
                            شروع بررسی
                          </button>
                        )}
                        {(r.status === "staff_reviewing" || r.status === "owner_contacted") && (
                          <button
                            onClick={() => setActiveAction(r.id)}
                            className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg"
                          >
                            تماس با مالک
                          </button>
                        )}
                        {r.status === "approved" && (
                          <button
                            onClick={() => setActiveAction(r.id)}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg"
                          >
                            تنظیم زمان بازدید
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
