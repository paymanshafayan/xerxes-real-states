"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Trash2,
  Plus,
  X,
  MapPin,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  History,
  User as UserIcon,
} from "lucide-react";
import VirtualTour from "@/components/VirtualTour";

interface ListingDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  city: string;
  district: string | null;
  address: string;
  category: string;
  status: string;
  approvalStatus: string;
  price: number | null;
  rentDeposit: number | null;
  monthlyRent: number | null;
  currency: string;
  listingKinds: string[];
  bedrooms: number;
  bathrooms: number;
  area: number;
  features: string[];
  images: string[];
  videos: string[];
  panoramas: string[];
  lat: number | null;
  lng: number | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  rejectionReason: string | null;
  assignedStaffId: number | null;
  createdAt: string;
  reviewedAt: string | null;
  history: any[];
  assignedStaff: { id: number; name: string; username: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار بررسی",
  approved: "تایید شده",
  rejected: "رد شده",
  removed: "حذف شده",
  unavailable_reported: "گزارش عدم موجودیت",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  removed: "bg-gray-100 text-gray-800 border-gray-300",
  unavailable_reported: "bg-red-100 text-red-900 border-red-300",
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  removed: X,
  unavailable_reported: AlertCircle,
};

export default function MyListingDetailContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showPanoramaModal, setShowPanoramaModal] = useState(false);
  const [panoramaFiles, setPanoramaFiles] = useState<File[]>([]);
  const [uploadingPanoramas, setUploadingPanoramas] = useState(false);
  const [previewPanorama, setPreviewPanorama] = useState<string | null>(null);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.push("/");
        return;
      }
      setLoading(true);
      const res = await fetch(`/api/listings/mine/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("auth_token");
        router.push("/");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setListing(data.listing);
      } else {
        alert("آگهی یافت نشد");
        router.push("/account/listings");
      }
    } catch (err) {
      console.error("Failed to fetch listing:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("آیا از حذف این آگهی اطمینان دارید؟")) return;
    try {
      setDeleting(true);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/listings/mine/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push("/account/listings");
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handlePanoramaUpload = async () => {
    if (panoramaFiles.length === 0) {
      alert("حداقل یک تصویر انتخاب کنید");
      return;
    }
    try {
      setUploadingPanoramas(true);
      const token = localStorage.getItem("auth_token");
      const fd = new FormData();
      panoramaFiles.forEach((f) => fd.append("panoramas", f));
      const res = await fetch(`/api/listings/mine/${id}/panoramas`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        setShowPanoramaModal(false);
        setPanoramaFiles([]);
        await fetchListing();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در آپلود");
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploadingPanoramas(false);
    }
  };

  const removePanorama = async (url: string) => {
    if (!confirm("آیا از حذف این تصویر ۳۶۰ اطمینان دارید؟")) return;
    try {
      const token = localStorage.getItem("auth_token");
      const encoded = encodeURIComponent(url);
      const res = await fetch(
        `/api/listings/mine/${id}/panoramas/${encoded}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        await fetchListing();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="h-96 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 text-center">
        <p>آگهی یافت نشد</p>
        <Link
          href="/account/listings"
          className="text-primary hover:underline mt-2 inline-block"
        >
          بازگشت به لیست
        </Link>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[listing.approvalStatus] || Clock;
  const panoramas = (listing.panoramas as string[]) || [];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/account/listings"
          className="flex items-center gap-1 text-gray-600 hover:text-primary"
        >
          <ArrowRight className="w-4 h-4" />
          <span className="text-sm">بازگشت به لیست</span>
        </Link>
        {["pending", "approved"].includes(listing.approvalStatus) && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            حذف آگهی
          </button>
        )}
      </div>

      {/* Title + Status */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {listing.title}
          </h1>
          <span
            className={`text-xs px-3 py-1 rounded-full border font-medium whitespace-nowrap flex items-center gap-1.5 ${
              STATUS_COLORS[listing.approvalStatus] || ""
            }`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {STATUS_LABELS[listing.approvalStatus] || listing.approvalStatus}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {listing.address}, {listing.city}
          </span>
          <span>• {listing.category}</span>
          <span>
            • {listing.bedrooms} خواب / {listing.bathrooms} حمام / {listing.area} متر
          </span>
        </div>
        {listing.rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <strong>دلیل رد:</strong> {listing.rejectionReason}
          </div>
        )}
      </div>

      {/* Cover images gallery */}
      {(listing.images as string[]).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            تصاویر عادی
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {(listing.images as string[]).map((img, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-lg overflow-hidden bg-gray-200"
              >
                <img
                  src={img}
                  alt={`تصویر ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panoramas 360 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            تصاویر ۳۶۰ درجه
          </h2>
          {listing.approvalStatus === "approved" && (
            <button
              onClick={() => setShowPanoramaModal(true)}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              افزودن
            </button>
          )}
        </div>

        {listing.approvalStatus !== "approved" && (
          <p className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            تصاویر ۳۶۰ درجه فقط پس از تایید آگهی توسط کارشناسان قابل افزودن هستند.
          </p>
        )}

        {panoramas.length === 0 && listing.approvalStatus === "approved" && (
          <p className="text-sm text-gray-500 text-center py-6">
            هنوز تصویر ۳۶۰ درجه‌ای اضافه نکرده‌اید. برای نمایش بهتر ملک، تصاویر
            equirectangular با نسبت ۲:۱ (مثلاً ۴۰۹۶×۲۰۴۸) اضافه کنید.
          </p>
        )}

        {panoramas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {panoramas.map((pano, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                <div className="aspect-[2/1] bg-gray-900 relative">
                  <img
                    src={pano}
                    alt={`۳۶۰ درجه ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-2 right-2 text-white text-xs font-medium">
                    ۳۶۰°
                  </div>
                </div>
                <div className="p-2 flex gap-1.5">
                  <button
                    onClick={() => setPreviewPanorama(pano)}
                    className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark"
                  >
                    مشاهده
                  </button>
                  <button
                    onClick={() => removePanorama(pano)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description + Features */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">توضیحات</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {listing.description}
        </p>
        {(listing.features as string[]).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ویژگی‌ها
            </h3>
            <div className="flex flex-wrap gap-2">
              {(listing.features as string[]).map((f, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">قیمت</h2>
        <div className="space-y-2">
          {listing.listingKinds.includes("sale") && listing.price && (
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-sm text-gray-700">قیمت فروش</span>
              <span className="font-bold text-primary">
                {listing.price.toLocaleString()} {listing.currency}
              </span>
            </div>
          )}
          {listing.listingKinds.includes("rent") && (
            <>
              {listing.rentDeposit && (
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="text-sm text-gray-700">ودیعه</span>
                  <span className="font-bold text-primary">
                    {listing.rentDeposit.toLocaleString()} {listing.currency}
                  </span>
                </div>
              )}
              {listing.monthlyRent && (
                <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                  <span className="text-sm text-gray-700">اجاره ماهانه</span>
                  <span className="font-bold text-primary">
                    {listing.monthlyRent.toLocaleString()} {listing.currency}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Assigned staff */}
      {listing.assignedStaff && listing.approvalStatus === "approved" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            کارشناس مسئول
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              {listing.assignedStaff.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {listing.assignedStaff.name}
              </p>
              <p className="text-xs text-gray-500">
                @{listing.assignedStaff.username}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status history */}
      {listing.history && listing.history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <History className="w-5 h-5" />
            تاریخچه
          </h2>
          <ol className="space-y-3">
            {listing.history.map((h, idx) => (
              <li key={idx} className="flex gap-3 text-sm">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">
                    {h.fromStatus
                      ? `${h.fromStatus} → ${h.toStatus}`
                      : `ایجاد (${h.toStatus})`}
                  </p>
                  {h.note && (
                    <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(h.createdAt).toLocaleString("en-US")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Panorama upload modal */}
      {showPanoramaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                افزودن تصویر ۳۶۰ درجه
              </h3>
              <button
                onClick={() => {
                  setShowPanoramaModal(false);
                  setPanoramaFiles([]);
                }}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              تصاویر باید equirectangular با نسبت ۲:۱ باشند. حداکثر ۱۰ تصویر.
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setPanoramaFiles(files.slice(0, 10));
              }}
              className="w-full text-sm mb-4"
            />
            {panoramaFiles.length > 0 && (
              <p className="text-xs text-gray-500 mb-3">
                {panoramaFiles.length} فایل انتخاب شد
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowPanoramaModal(false);
                  setPanoramaFiles([]);
                }}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                انصراف
              </button>
              <button
                onClick={handlePanoramaUpload}
                disabled={uploadingPanoramas || panoramaFiles.length === 0}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {uploadingPanoramas ? "در حال آپلود..." : "افزودن"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panorama preview modal */}
      {previewPanorama && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setPreviewPanorama(null)}
        >
          <div className="w-full h-full max-w-6xl max-h-screen p-4">
            <VirtualTour
              images360={[previewPanorama]}
              propertyTitle="پیش‌نمایش ۳۶۰ درجه"
            />
          </div>
        </div>
      )}
    </div>
  );
}
