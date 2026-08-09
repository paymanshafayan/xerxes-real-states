"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface VisitRequest {
  visitRequest: {
    id: number;
    listingId: number;
    status: string;
    preferredDate: string | null;
    appointmentDate: string | null;
    appointmentNotes: string | null;
    ownerResponse: string | null;
    createdAt: string;
  };
  listing: {
    id: number;
    title: string;
    city: string;
    slug: string;
    images: string[];
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  staff_reviewing: "در حال بررسی توسط کارشناس",
  owner_contacted: "تماس با صاحب ملک",
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

export default function MyVisitRequestsContent() {
  const router = useRouter();
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/");
        return;
      }
      setLoading(true);
      const res = await fetch("/api/visit-requests/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.visitRequests || []);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              درخواست‌های بازدید من
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {requests.length} درخواست
            </p>
          </div>
        </div>
        <Link
          href="/account"
          className="flex items-center gap-1 text-gray-600 hover:text-primary text-sm"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            درخواست بازدیدی ثبت نکرده‌اید
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            برای ثبت درخواست، به صفحه جزئیات هر ملک بروید
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const cover = (r.listing.images as string[])?.[0] || "/placeholder.jpg";
            return (
              <div
                key={r.visitRequest.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex gap-4"
              >
                <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  <img
                    src={cover}
                    alt={r.listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {r.listing.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        STATUS_COLORS[r.visitRequest.status] || "bg-gray-100"
                      }`}
                    >
                      {STATUS_LABELS[r.visitRequest.status] || r.visitRequest.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{r.listing.city}</p>

                  {r.visitRequest.appointmentDate && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                      <CheckCircle className="w-3 h-3 inline ml-1" />
                      <strong>زمان بازدید:</strong>{" "}
                      {new Date(r.visitRequest.appointmentDate).toLocaleString("en-US")}
                      {r.visitRequest.appointmentNotes && (
                        <span className="block mt-1">
                          یادداشت: {r.visitRequest.appointmentNotes}
                        </span>
                      )}
                    </div>
                  )}

                  {r.visitRequest.status === "rejected" && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                      <XCircle className="w-3 h-3 inline ml-1" />
                      درخواست شما رد شد.
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 mt-2">
                    ثبت شده در: {new Date(r.visitRequest.createdAt).toLocaleString("en-US")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
