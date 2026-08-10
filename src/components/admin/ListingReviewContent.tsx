"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  User as UserIcon,
} from "lucide-react";

export default function ListingReviewContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState("");

  const fetchListing = async () => {
    try {
      setLoading(true);
      const res = await adminFetch(`/api/staff/listings/${id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError("آگهی یافت نشد");
      }
    } catch (err: any) {
      setError(err?.message || "خطا");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  const handleApprove = async () => {
    if (!confirm("آیا از تایید این آگهی اطمینان دارید؟")) return;
    try {
      setActing(true);
      const res = await adminFetch(`/api/staff/listings/${id}/approve`, { method: "POST" });
      if (res.ok) {
        alert("آگهی تایید و در لیست عمومی منتشر شد");
        router.push("/admin/user-listings");
      } else {
        const err = await res.json();
        setError(err.error || "خطا");
      }
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (rejectionReason.length < 5) {
      setError("دلیل رد باید حداقل ۵ کاراکتر باشد");
      return;
    }
    try {
      setActing(true);
      const res = await adminFetch(`/api/staff/listings/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectionReason }),
      });
      if (res.ok) {
        alert("آگهی رد شد");
        router.push("/admin/user-listings");
      } else {
        const err = await res.json();
        setError(err.error || "خطا");
      }
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setActing(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-96 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || "آگهی یافت نشد"}</p>
        <Link href="/admin/user-listings" className="text-primary hover:underline">
          بازگشت
        </Link>
      </div>
    );
  }

  const { listing, owner, property, permissions } = data;
  const canApprove = permissions?.canApprove;
  const canReject = permissions?.canReject;

  return (
    <div className="p-6 max-w-6xl">
      <Link
        href="/admin/user-listings"
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        بازگشت به لیست
      </Link>

      {!canApprove && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          این آگهی توسط کارشناس {listing.assignedStaff?.name} مدیریت می‌شود. شما فقط
          دسترسی مشاهده دارید.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            {listing.approvalStatus}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          {listing.city} • {listing.category} • {listing.area} m² • {listing.bedrooms} خواب
        </p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{listing.description}</p>
      </div>

      {/* Images */}
      {(listing.images as string[])?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="font-semibold mb-3">تصاویر</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {(listing.images as string[]).map((img: string, idx: number) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <h2 className="font-semibold mb-3">قیمت</h2>
        {listing.price && (
          <p className="text-lg font-bold text-primary">
            فروش: {listing.price.toLocaleString()} {listing.currency}
          </p>
        )}
        {listing.rentDeposit && (
          <p className="text-sm">
            ودیعه: {listing.rentDeposit.toLocaleString()} {listing.currency}
          </p>
        )}
        {listing.monthlyRent && (
          <p className="text-sm">
            ماهانه: {listing.monthlyRent.toLocaleString()} {listing.currency}
          </p>
        )}
      </div>

      {/* Owner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <UserIcon className="w-5 h-5" />
          مالک
        </h2>
        {owner && (
          <div className="text-sm space-y-1">
            <p>
              <span className="text-gray-500">نام:</span> {owner.name}
            </p>
            <p>
              <span className="text-gray-500">ایمیل:</span> {owner.email}
            </p>
            <p>
              <span className="text-gray-500">تلفن:</span> {owner.phone || "—"}
            </p>
            {owner.isBlocked && (
              <p className="text-red-600 font-medium">⚠️ حساب بلاک شده</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {listing.approvalStatus === "pending" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm flex gap-3 sticky bottom-4">
          <button
            onClick={handleApprove}
            disabled={acting || !canApprove}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            تایید و انتشار
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={acting || !canReject}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            رد
          </button>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-semibold mb-3">دلیل رد آگهی</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3"
              placeholder="دلیل رد را با جزئیات بنویسید..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
              >
                انصراف
              </button>
              <button
                onClick={handleReject}
                disabled={acting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
              >
                {acting ? "در حال ثبت..." : "رد نهایی"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
