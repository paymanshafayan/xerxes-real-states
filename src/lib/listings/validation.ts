import { z } from "zod";

// =============================================================================
// Phase 8: User Listings - Zod Validation Schemas
// =============================================================================

// --- User profile update ---
export const userProfileUpdateSchema = z.object({
  lastName: z.string().trim().min(1, "نام خانوادگی الزامی است").max(100).optional(),
  nationalId: z.string().trim().max(20).optional().or(z.literal("")),
  addressLine: z.string().trim().min(1, "آدرس الزامی است").max(500).optional(),
  city: z.string().trim().min(1, "شهر الزامی است").max(100).optional(),
  country: z.string().trim().max(100).default("Turkey").optional(),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  profileCompleted: z.boolean().optional(),
});
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;

// --- Listing create (user submission) ---
const listingKindSchema = z.enum(["sale", "rent"]);

export const listingCreateSchema = z
  .object({
    // Step 1 - profile (optional if already completed)
    profile: userProfileUpdateSchema.optional(),

    // Step 2 - listing nature
    listingKinds: z
      .array(listingKindSchema)
      .min(1, "حداقل یک نوع آگهی (فروش یا اجاره) انتخاب کنید")
      .max(2),
    category: z.enum(["villa", "apartment", "land", "commercial"]),

    // Step 3 - content
    title: z.string().trim().min(5, "عنوان باید حداقل ۵ کاراکتر باشد").max(200),
    description: z.string().trim().min(20, "توضیحات باید حداقل ۲۰ کاراکتر باشد").max(5000),
    bedrooms: z.number().int().min(0).max(50).default(0),
    bathrooms: z.number().int().min(0).max(50).default(0),
    area: z.number().positive("متراژ باید مثبت باشد").max(100000),
    features: z.array(z.string().trim().min(1).max(50)).max(30).default([]),

    // Step 4 - location
    address: z.string().trim().min(5, "آدرس باید حداقل ۵ کاراکتر باشد").max(500),
    city: z.string().trim().min(1, "شهر الزامی است").max(100),
    district: z.string().trim().max(100).optional().or(z.literal("")),
    country: z.string().trim().max(100).default("Turkey"),
    lat: z.number().min(-90).max(90).optional().nullable(),
    lng: z.number().min(-180).max(180).optional().nullable(),

    // Step 5 - pricing
    price: z.number().positive("قیمت فروش باید مثبت باشد").max(1e12).optional().nullable(),
    rentDeposit: z.number().positive("ودیعه باید مثبت باشد").max(1e12).optional().nullable(),
    monthlyRent: z.number().positive("اجاره ماهانه باید مثبت باشد").max(1e12).optional().nullable(),
    currency: z.string().length(3).default("GBP"),

    // Step 6 - media (already uploaded URLs, not files)
    images: z.array(z.string().url().or(z.string().startsWith("/"))).min(3, "حداقل ۳ تصویر الزامی است").max(20),
    videos: z.array(z.string().url().or(z.string().startsWith("/"))).max(5).default([]),

    // Step 7 - commitment
    commitmentAccepted: z.literal(true, {
      errorMap: () => ({ message: "پذیرش تعهد الزامی است" }),
    }),
  })
  .superRefine((data, ctx) => {
    // Pricing validation based on listingKinds
    const hasSale = data.listingKinds.includes("sale");
    const hasRent = data.listingKinds.includes("rent");

    if (hasSale && (!data.price || data.price <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "برای آگهی فروش، قیمت فروش الزامی است",
      });
    }
    if (hasRent) {
      if (!data.rentDeposit || data.rentDeposit <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rentDeposit"],
          message: "برای آگهی اجاره، ودیعه الزامی است",
        });
      }
      if (!data.monthlyRent || data.monthlyRent <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["monthlyRent"],
          message: "برای آگهی اجاره، اجاره ماهانه الزامی است",
        });
      }
    }
    if (!hasSale && data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "قیمت فروش فقط برای آگهی فروش مجاز است",
      });
    }
    if (!hasRent && (data.rentDeposit || data.monthlyRent)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rentDeposit"],
        message: "ودیعه و اجاره فقط برای آگهی اجاره مجاز است",
      });
    }
  });

export type ListingCreateInput = z.infer<typeof listingCreateSchema>;

// --- Panorama upload ---
export const panoramaUploadSchema = z.object({
  url: z.string().url().or(z.string().startsWith("/")),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type PanoramaUploadInput = z.infer<typeof panoramaUploadSchema>;

// --- Notification read ---
export const notificationIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// --- Visit request create ---
export const visitRequestCreateSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  requesterName: z.string().trim().min(2).max(100),
  requesterPhone: z.string().trim().min(7).max(20),
  requesterEmail: z.string().email().optional().or(z.literal("")),
  preferredDate: z.coerce.date().optional().nullable(),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type VisitRequestCreateInput = z.infer<typeof visitRequestCreateSchema>;

// --- Reassign request ---
export const reassignRequestSchema = z.object({
  reason: z.string().trim().min(10, "دلیل باید حداقل ۱۰ کاراکتر باشد").max(1000),
  preferredStaffId: z.coerce.number().int().positive().optional().nullable(),
});
export type ReassignRequestInput = z.infer<typeof reassignRequestSchema>;

// --- Unblock user ---
export const unblockUserSchema = z.object({
  reason: z.string().trim().min(5, "دلیل رفع بلاک الزامی است").max(500),
});
