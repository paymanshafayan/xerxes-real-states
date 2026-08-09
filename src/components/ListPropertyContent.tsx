"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  Tag,
  Home,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Send,
} from "lucide-react";

const STEPS = [
  { key: "profile", title: "اطلاعات مالک", icon: User },
  { key: "kind", title: "نوع آگهی", icon: Tag },
  { key: "specs", title: "مشخصات ملک", icon: Home },
  { key: "location", title: "آدرس و لوکیشن", icon: MapPin },
  { key: "pricing", title: "قیمت‌ها", icon: DollarSign },
  { key: "media", title: "تصاویر و ویدیو", icon: ImageIcon },
  { key: "review", title: "بررسی و ارسال", icon: Send },
];

export default function ListPropertyContent() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [authChecking, setAuthChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [profile, setProfile] = useState({
    lastName: "",
    nationalId: "",
    addressLine: "",
    city: "",
    country: "Turkey",
    postalCode: "",
  });
  const [profileCompleted, setProfileCompleted] = useState(false);

  // Step 2
  const [listingKinds, setListingKinds] = useState<("sale" | "rent")[]>([]);
  const [category, setCategory] = useState<
    "villa" | "apartment" | "land" | "commercial"
  >("apartment");

  // Step 3
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [area, setArea] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);

  // Step 4
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Step 5
  const [price, setPrice] = useState<number | null>(null);
  const [rentDeposit, setRentDeposit] = useState<number | null>(null);
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);
  const [currency, setCurrency] = useState("GBP");

  // Step 6
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Step 7
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);

  // Auth check + profile load
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        alert("برای ثبت ملک ابتدا وارد حساب کاربری خود شوید.");
        router.push("/");
        return;
      }
      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile({
              lastName: data.profile.lastName || "",
              nationalId: data.profile.nationalId || "",
              addressLine: data.profile.addressLine || "",
              city: data.profile.city || "",
              country: data.profile.country || "Turkey",
              postalCode: data.profile.postalCode || "",
            });
            setProfileCompleted(!!data.profile.profileCompleted);
          }
        }
      } catch (err) {
        console.error("Profile load failed:", err);
      } finally {
        setAuthChecking(false);
      }
    };
    init();
  }, [router]);

  // Image previews
  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  const nextStep = () => {
    setError("");
    // Validation per step
    if (step === 0) {
      if (!profile.lastName || !profile.addressLine || !profile.city) {
        setError("نام خانوادگی، آدرس و شهر الزامی است");
        return;
      }
    }
    if (step === 1) {
      if (listingKinds.length === 0) {
        setError("حداقل یک نوع آگهی (فروش یا اجاره) انتخاب کنید");
        return;
      }
    }
    if (step === 2) {
      if (title.length < 5) {
        setError("عنوان باید حداقل ۵ کاراکتر باشد");
        return;
      }
      if (description.length < 20) {
        setError("توضیحات باید حداقل ۲۰ کاراکتر باشد");
        return;
      }
      if (area <= 0) {
        setError("متراژ باید بزرگ‌تر از صفر باشد");
        return;
      }
    }
    if (step === 3) {
      if (address.length < 5 || !city) {
        setError("آدرس و شهر الزامی است");
        return;
      }
    }
    if (step === 4) {
      if (listingKinds.includes("sale") && (!price || price <= 0)) {
        setError("برای آگهی فروش، قیمت فروش الزامی است");
        return;
      }
      if (listingKinds.includes("rent")) {
        if (!rentDeposit || rentDeposit <= 0) {
          setError("برای آگهی اجاره، ودیعه الزامی است");
          return;
        }
        if (!monthlyRent || monthlyRent <= 0) {
          setError("برای آگهی اجاره، اجاره ماهانه الزامی است");
          return;
        }
      }
    }
    if (step === 5) {
      if (imageFiles.length < 3) {
        setError("حداقل ۳ تصویر الزامی است");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!commitmentAccepted) {
      setError("پذیرش تعهد الزامی است");
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("auth_token");
      const fd = new FormData();

      // Profile is auto-updated server-side
      const data = {
        profile,
        listingKinds,
        category,
        title,
        description,
        bedrooms,
        bathrooms,
        area,
        features,
        address,
        city,
        district,
        country: profile.country,
        lat,
        lng,
        price,
        rentDeposit,
        monthlyRent,
        currency,
        commitmentAccepted: true,
      };
      fd.append("data", JSON.stringify(data));
      imageFiles.forEach((f) => fd.append("images", f));
      videoFiles.forEach((f) => fd.append("videos", f));

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (res.ok) {
        const result = await res.json();
        alert(result.message || "آگهی شما با موفقیت ثبت شد.");
        router.push("/account/listings");
      } else {
        const errData = await res.json();
        if (errData.details) {
          setError(errData.details.map((d: any) => d.message).join("\n"));
        } else {
          setError(errData.error || "خطا در ثبت");
        }
      }
    } catch (err: any) {
      setError(err?.message || "خطا در ارسال");
    } finally {
      setSubmitting(false);
    }
  };

  if (authChecking) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="h-96 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const StepIcon = STEPS[step].icon;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        ثبت ملک جدید
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        ملک خود را برای فروش یا اجاره در سایت ثبت کنید
      </p>

      {/* Stepper */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm overflow-x-auto">
        <ol className="flex items-center gap-2 min-w-max">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const done = idx < step;
            const active = idx === step;
            return (
              <li key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    done
                      ? "bg-green-100 text-green-700"
                      : active
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  <span className="text-xs font-medium hidden sm:inline">{s.title}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <ChevronLeft className="w-4 h-4 text-gray-300" />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Form panel */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* Step 0: Profile */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-3">اطلاعات مالک</h2>
            {profileCompleted && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                ✓ پروفایل شما تکمیل است. می‌توانید اطلاعات را ویرایش کنید یا به مرحله بعد بروید.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  نام خانوادگی <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                  placeholder="نام خانوادگی"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  کد ملی (اختیاری)
                </label>
                <input
                  type="text"
                  value={profile.nationalId}
                  onChange={(e) => setProfile({ ...profile, nationalId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                آدرس کامل <span className="text-red-500">*</span>
              </label>
              <textarea
                value={profile.addressLine}
                onChange={(e) => setProfile({ ...profile, addressLine: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                placeholder="خیابان، کوچه، پلاک، طبقه"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  شهر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">کشور</label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  کد پستی (اختیاری)
                </label>
                <input
                  type="text"
                  value={profile.postalCode}
                  onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Listing kind */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-3">نوع آگهی</h2>
            <p className="text-sm text-gray-500 mb-4">
              می‌توانید همزمان ملک را برای فروش و اجاره ثبت کنید
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="checkbox"
                  checked={listingKinds.includes("sale")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setListingKinds([...listingKinds, "sale"]);
                    } else {
                      setListingKinds(listingKinds.filter((k) => k !== "sale"));
                      setPrice(null);
                    }
                  }}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">برای فروش</p>
                  <p className="text-xs text-gray-500">ملک شما با قیمت فروش نمایش داده می‌شود</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="checkbox"
                  checked={listingKinds.includes("rent")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setListingKinds([...listingKinds, "rent"]);
                    } else {
                      setListingKinds(listingKinds.filter((k) => k !== "rent"));
                      setRentDeposit(null);
                      setMonthlyRent(null);
                    }
                  }}
                  className="w-5 h-5"
                />
                <div>
                  <p className="font-medium">برای اجاره</p>
                  <p className="text-xs text-gray-500">ملک شما با ودیعه و اجاره ماهانه نمایش داده می‌شود</p>
                </div>
              </label>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">دسته‌بندی ملک</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: "villa", label: "ویلا" },
                  { value: "apartment", label: "آپارتمان" },
                  { value: "land", label: "زمین" },
                  { value: "commercial", label: "تجاری" },
                ].map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value as any)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      category === c.value
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Property specs */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-3">مشخصات ملک</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                عنوان <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                placeholder="مثلاً: آپارتمان ۳ خوابه در آنتالیا"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                توضیحات <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                placeholder="توضیحات کامل درباره ملک، موقعیت، دسترسی‌ها و..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">متراژ (m²)</label>
                <input
                  type="number"
                  value={area || ""}
                  onChange={(e) => setArea(Number(e.target.value) || 0)}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">خواب</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value) || 0)}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">حمام</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value) || 0)}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">ویژگی‌ها</label>
              <div className="flex flex-wrap gap-2">
                {["پارکینگ", "استخر", "آسانسور", "بالکن", "انباری", "سرویس بهداشتی فرنگی", "درب ضد سرقت", "کولر گازی"].map((f) => {
                  const sel = features.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() =>
                        setFeatures(sel ? features.filter((x) => x !== f) : [...features, f])
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        sel
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-3">آدرس و لوکیشن</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                آدرس کامل <span className="text-red-500">*</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                placeholder="آدرس دقیق ملک (فقط برای کارشناسان قابل مشاهده)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  شهر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">منطقه/محله</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                لوکیشن (اختیاری — برای نمایش روی نقشه)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                برای دقت بیشتر، طول و عرض جغرافیایی را وارد کنید. می‌توانید از Google Maps کپی کنید.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.000001"
                  value={lat ?? ""}
                  onChange={(e) => setLat(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Latitude (عرض)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={lng ?? ""}
                  onChange={(e) => setLng(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Longitude (طول)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-3">قیمت‌ها</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">واحد ارز</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="TRY">TRY (₺)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
            {listingKinds.includes("sale") && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  قیمت فروش <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={price ?? ""}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                />
              </div>
            )}
            {listingKinds.includes("rent") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    ودیعه <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={rentDeposit ?? ""}
                    onChange={(e) => setRentDeposit(e.target.value ? Number(e.target.value) : null)}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    اجاره ماهانه <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={monthlyRent ?? ""}
                    onChange={(e) => setMonthlyRent(e.target.value ? Number(e.target.value) : null)}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Media */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-3">تصاویر و ویدیو</h2>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                تصاویر <span className="text-red-500">*</span>{" "}
                <span className="text-gray-500 text-xs">(حداقل ۳، حداکثر ۲۰)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 20);
                  setImageFiles(files);
                }}
                className="w-full text-sm"
              />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                  {imagePreviews.map((url, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-200 relative"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 right-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded">
                          کاور
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                ویدیو (اختیاری، حداکثر ۲)
              </label>
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []).slice(0, 2);
                  setVideoFiles(files);
                }}
                className="w-full text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
              💡 تصاویر ۳۶۰ درجه (panorama) را بعد از تایید آگهی توسط کارشناسان می‌توانید
              از صفحه جزئیات آگهی اضافه کنید.
            </p>
          </div>
        )}

        {/* Step 6: Review + commitment */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-3">بررسی نهایی</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500">عنوان</p>
                <p className="font-medium">{title}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500">نوع</p>
                <p className="font-medium">
                  {listingKinds.map((k) => (k === "sale" ? "فروش" : "اجاره")).join(" + ")} • {category}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500">موقعیت</p>
                <p className="font-medium">{city}{district && `, ${district}`}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500">مشخصات</p>
                <p className="font-medium">
                  {area} m² • {bedrooms} خواب • {bathrooms} حمام
                </p>
              </div>
              {listingKinds.includes("sale") && price && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs text-gray-500">قیمت فروش</p>
                  <p className="font-bold text-primary">
                    {price.toLocaleString()} {currency}
                  </p>
                </div>
              )}
              {listingKinds.includes("rent") && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs text-gray-500">اجاره</p>
                  <p className="font-bold text-primary">
                    ودیعه: {rentDeposit?.toLocaleString()} / ماهانه: {monthlyRent?.toLocaleString()} {currency}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                تعهد مهم
              </h3>
              <p className="text-sm text-yellow-900 leading-relaxed mb-3">
                شما متعهد می‌شوید که در صورت فروش، اجاره یا انصراف از ملک،{" "}
                <strong>بلافاصله</strong> آن را از لیست شخصی خود حذف کنید. در غیر این
                صورت، در صورت درخواست بازدید توسط سایر کاربران و عدم موجودیت ملک،
                حساب شما <strong>بلاک شده</strong> و تمام آگهی‌های ثبت‌شده شما حذف
                خواهند شد.
              </p>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commitmentAccepted}
                  onChange={(e) => setCommitmentAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5"
                />
                <span className="text-sm text-yellow-900">
                  متعهد می‌شوم پس از فروش، اجاره یا انصراف از ملک، آن را بلافاصله از
                  سیستم حذف کنم.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex justify-between mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          {step > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              قبلی
            </button>
          ) : (
            <div />
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark flex items-center gap-1"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !commitmentAccepted}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? "در حال ارسال..." : "ارسال برای بررسی"}
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
