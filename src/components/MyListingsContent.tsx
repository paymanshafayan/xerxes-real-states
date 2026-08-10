"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Megaphone, Plus, Eye, Trash2, Filter } from "lucide-react";

interface Listing {
  id: number;
  slug: string;
  title: string;
  description: string;
  city: string;
  category: string;
  images: string[];
  status: string;
  approvalStatus: string;
  price: number | null;
  rentDeposit: number | null;
  monthlyRent: number | null;
  currency: string;
  listingKinds: string[];
  createdAt: string;
  assignedStaffId: number | null;
}

interface Summary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  removed: number;
  unavailable_reported: number;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "removed" | "unavailable_reported";

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  approved: "تایید شده",
  rejected: "رد شده",
  removed: "حذف شده",
  unavailable_reported: "گزارش عدم موجودیت",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  removed: "bg-gray-100 text-gray-800 border-gray-200",
  unavailable_reported: "bg-red-100 text-red-900 border-red-300",
};

export default function MyListingsContent() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/");
        return;
      }
      setLoading(true);
      const url =
        filter === "all"
          ? "/api/listings/mine"
          : `/api/listings/mine?status=${filter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("auth_token");
        router.push("/");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این آگهی اطمینان دارید؟")) return;
    try {
      setDeletingId(id);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/listings/mine/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchListings();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف آگهی");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (l: Listing) => {
    if (l.listingKinds.includes("sale") && l.price) {
      return `${l.price.toLocaleString()} ${l.currency}`;
    }
    if (l.listingKinds.includes("rent")) {
      const parts = [];
      if (l.rentDeposit) parts.push(`ودیعه: ${l.rentDeposit.toLocaleString()}`);
      if (l.monthlyRent) parts.push(`ماهانه: ${l.monthlyRent.toLocaleString()}`);
      return parts.join(" / ") + ` ${l.currency}`;
    }
    return "—";
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              آگهی‌های من
            </h1>
            {summary && (
              <p className="text-sm text-gray-500 mt-0.5">
                {summary.total} آگهی ثبت‌شده
                {summary.pending > 0 && (
                  <span className="text-yellow-600 mr-2">
                    ({summary.pending} در انتظار بررسی)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/list-property"
          className="px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          ثبت ملک جدید
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: "all", label: "همه", count: summary?.total },
          { key: "pending", label: "در انتظار", count: summary?.pending },
          { key: "approved", label: "تایید شده", count: summary?.approved },
          { key: "rejected", label: "رد شده", count: summary?.rejected },
          { key: "removed", label: "حذف شده", count: summary?.removed },
          {
            key: "unavailable_reported",
            label: "عدم موجودیت",
            count: summary?.unavailable_reported,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as StatusFilter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === tab.key
                ? "bg-primary text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="mr-1.5 opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
          <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            آگهی ثبت نکرده‌اید
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            اولین ملک خود را برای فروش یا اجاره ثبت کنید
          </p>
          <Link
            href="/list-property"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition"
          >
            <Plus className="w-4 h-4" />
            ثبت ملک
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((l) => {
            const cover = (l.images as string[])?.[0] || "/placeholder.jpg";
            const status = l.approvalStatus;
            return (
              <div
                key={l.id}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 dark:border-gray-700"
              >
                <div className="flex">
                  <div className="w-32 h-32 shrink-0 bg-gray-200">
                    <img
                      src={cover}
                      alt={l.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.jpg";
                      }}
                    />
                  </div>
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {l.title}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                          STATUS_COLORS[status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABELS[status] || status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {l.city} • {l.category}
                    </p>
                    <p className="text-sm font-medium text-primary mb-2">
                      {formatPrice(l)}
                    </p>
                    <div className="flex gap-1 mt-auto">
                      <Link
                        href={`/account/listings/${l.id}`}
                        className="flex-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        مشاهده
                      </Link>
                      {["pending", "approved"].includes(status) && (
                        <button
                          onClick={() => handleDelete(l.id)}
                          disabled={deletingId === l.id}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          حذف
                        </button>
                      )}
                    </div>
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
