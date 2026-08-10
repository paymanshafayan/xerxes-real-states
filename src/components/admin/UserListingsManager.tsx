"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";
import { Megaphone, Eye, CheckCircle, XCircle } from "lucide-react";

interface Listing {
  listing: {
    id: number;
    title: string;
    city: string;
    category: string;
    images: string[];
    approvalStatus: string;
    assignedStaffId: number | null;
    createdAt: string;
  };
  assignedStaff: { id: number; name: string; username: string } | null;
  owner: { id: number; name: string; email: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  approved: "تایید شده",
  rejected: "رد شده",
  removed: "حذف شده",
  unavailable_reported: "گزارش عدم موجودیت",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  removed: "bg-gray-100 text-gray-800",
  unavailable_reported: "bg-red-100 text-red-900",
};

export default function UserListingsManager() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`/api/staff/listings?status=${status}&limit=100`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [status]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">آگهی‌های کاربران</h2>
            <p className="text-sm text-gray-500">{listings.length} مورد</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["pending", "approved", "rejected", "removed", "unavailable_reported"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              status === s ? "bg-primary text-white" : "bg-white border border-gray-200"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <Megaphone className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">موردی یافت نشد</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">تصویر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">عنوان</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">شهر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">کاربر</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">کارشناس</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">وضعیت</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((row) => {
                const l = row.listing;
                const cover = (l.images as string[])?.[0] || "/placeholder.jpg";
                return (
                  <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                        <img src={cover} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 line-clamp-1 max-w-xs">
                      {l.title}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{l.city}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {row.owner?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.assignedStaff ? (
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                          {row.assignedStaff.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">تخصیص نشده</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[l.approvalStatus] || "bg-gray-100"
                        }`}
                      >
                        {STATUS_LABELS[l.approvalStatus] || l.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/user-listings/${l.id}`}
                        className="text-primary hover:underline text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        بررسی
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
