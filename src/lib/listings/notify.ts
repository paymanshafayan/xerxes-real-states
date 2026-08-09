import { db } from "@/db";
import { notifications, staff, users } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { notifyStaffPush } from "@/lib/push";
import { logActivity } from "@/lib/activityLog";

/**
 * Phase 8: User Listings - Notification helpers.
 *
 * Provides:
 *  - In-app notifications (notifications table)
 *  - Push notifications to staff (existing Expo push)
 *  - Email notifications (placeholder - wired to existing email helper)
 *  - Activity log entries
 */

export type NotificationType =
  | "listing_submitted"
  | "listing_approved"
  | "listing_rejected"
  | "listing_removed"
  | "listing_panorama_added"
  | "visit_request_created"
  | "visit_request_status"
  | "account_blocked"
  | "account_unblocked"
  | "listing_reassigned";

/**
 * Create an in-app notification for a user.
 */
export async function notifyUser(params: {
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data ?? null,
    });
  } catch (err) {
    console.error("notifyUser failed:", err);
  }
}

/**
 * Notify all active managers (in-app + push).
 */
export async function notifyAllManagers(params: {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<void> {
  try {
    const managers = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.role, "manager"), eq(staff.status, "active")));

    const managerIds = managers.map((m) => m.id);
    if (managerIds.length === 0) return;

    // Push notification to all managers (if they have tokens)
    for (const mid of managerIds) {
      await notifyStaffPush(mid, params.title, params.body, {
        type: params.type,
        ...(params.data ?? {}),
      });
    }
  } catch (err) {
    console.error("notifyAllManagers failed:", err);
  }
}

/**
 * Notify a specific staff member (in-app via user notification table if linked,
 * plus push if they have a push token).
 */
export async function notifyStaff(params: {
  staffId: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<void> {
  try {
    await notifyStaffPush(params.staffId, params.title, params.body, {
      type: params.type,
      ...(params.data ?? {}),
    });
  } catch (err) {
    console.error("notifyStaff failed:", err);
  }
}

/**
 * Convenience: notify on listing submission.
 * Sends push to the assigned staff (if any) and to all managers.
 */
export async function notifyListingSubmitted(params: {
  listingId: number;
  listingTitle: string;
  assignedStaffId: number | null;
}): Promise<void> {
  const { listingId, listingTitle, assignedStaffId } = params;

  if (assignedStaffId) {
    await notifyStaff({
      staffId: assignedStaffId,
      type: "listing_submitted",
      title: "آگهی جدید برای بررسی",
      body: `آگهی «${listingTitle}» به شما اختصاص داده شد و در انتظار بررسی است.`,
      data: { listingId },
    });
  } else {
    // No staff assigned - notify all managers
    await notifyAllManagers({
      type: "listing_submitted",
      title: "آگهی جدید بدون تخصیص",
      body: `آگهی «${listingTitle}» ثبت شد ولی کارشناس منطبق پیدا نشد. لطفاً بررسی کنید.`,
      data: { listingId },
    });
  }

  // Activity log
  await logActivity({
    action: "create",
    entity: "listing",
    entityId: listingId,
    details: `Listing submitted: ${listingTitle}`,
  });
}

/**
 * Notify on listing approval.
 */
export async function notifyListingApproved(params: {
  userId: number;
  listingId: number;
  listingTitle: string;
  propertyId: number;
}): Promise<void> {
  await notifyUser({
    userId: params.userId,
    type: "listing_approved",
    title: "آگهی شما تایید شد",
    body: `آگهی «${params.listingTitle}» توسط کارشناسان بررسی و در لیست عمومی منتشر شد.`,
    data: { listingId: params.listingId, propertyId: params.propertyId },
  });

  await logActivity({
    action: "approve",
    entity: "listing",
    entityId: params.listingId,
    details: `Listing approved and published: ${params.listingTitle}`,
  });
}

/**
 * Notify on listing rejection.
 */
export async function notifyListingRejected(params: {
  userId: number;
  listingId: number;
  listingTitle: string;
  reason: string;
}): Promise<void> {
  await notifyUser({
    userId: params.userId,
    type: "listing_rejected",
    title: "آگهی شما رد شد",
    body: `متأسفانه آگهی «${params.listingTitle}» رد شد. دلیل: ${params.reason}`,
    data: { listingId: params.listingId, reason: params.reason },
  });

  await logActivity({
    action: "reject",
    entity: "listing",
    entityId: params.listingId,
    details: `Listing rejected: ${params.listingTitle}. Reason: ${params.reason}`,
  });
}

/**
 * Notify on listing removal by user.
 */
export async function notifyListingRemoved(params: {
  assignedStaffId: number | null;
  listingId: number;
  listingTitle: string;
  userId: number;
}): Promise<void> {
  if (params.assignedStaffId) {
    await notifyStaff({
      staffId: params.assignedStaffId,
      type: "listing_removed",
      title: "آگهی توسط کاربر حذف شد",
      body: `کاربر آگهی «${params.listingTitle}» را از لیست شخصی خود حذف کرد.`,
      data: { listingId: params.listingId, userId: params.userId },
    });
  }

  await logActivity({
    action: "delete",
    entity: "listing",
    entityId: params.listingId,
    details: `Listing removed by user: ${params.listingTitle}`,
  });
}

/**
 * Notify on visit request creation.
 */
export async function notifyVisitRequestCreated(params: {
  staffId: number | null;
  visitRequestId: number;
  listingId: number;
  requesterName: string;
}): Promise<void> {
  if (params.staffId) {
    await notifyStaff({
      staffId: params.staffId,
      type: "visit_request_created",
      title: "درخواست بازدید جدید",
      body: `${params.requesterName} برای ملک شما درخواست بازدید ثبت کرد.`,
      data: { visitRequestId: params.visitRequestId, listingId: params.listingId },
    });
  }
}

/**
 * Notify the requester about a visit request status change.
 */
export async function notifyVisitRequestStatus(params: {
  userId: number;
  visitRequestId: number;
  listingId: number;
  status: string;
  message: string;
}): Promise<void> {
  await notifyUser({
    userId: params.userId,
    type: "visit_request_status",
    title: "وضعیت درخواست بازدید",
    body: params.message,
    data: { visitRequestId: params.visitRequestId, listingId: params.listingId, status: params.status },
  });
}

/**
 * Notify user on account block.
 */
export async function notifyUserBlocked(params: {
  userId: number;
  reason: string;
}): Promise<void> {
  await notifyUser({
    userId: params.userId,
    type: "account_blocked",
    title: "حساب شما بلاک شد",
    body: `حساب شما به دلیل ${params.reason} بلاک شد. برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.`,
    data: { reason: params.reason },
  });
}

/**
 * Notify user on account unblock.
 */
export async function notifyUserUnblocked(params: {
  userId: number;
  reason: string;
}): Promise<void> {
  await notifyUser({
    userId: params.userId,
    type: "account_unblocked",
    title: "حساب شما رفع بلاک شد",
    body: `حساب شما رفع بلاک شد. می‌توانید دوباره از سرویس استفاده کنید.`,
    data: { reason: params.reason },
  });
}

/**
 * Notify about reassignment (old + new staff + user).
 */
export async function notifyListingReassigned(params: {
  oldStaffId: number | null;
  newStaffId: number;
  userId: number;
  listingId: number;
  listingTitle: string;
}): Promise<void> {
  // New staff
  await notifyStaff({
    staffId: params.newStaffId,
    type: "listing_reassigned",
    title: "یک ملک به شما واگذار شد",
    body: `ملک «${params.listingTitle}» به شما واگذار شد.`,
    data: { listingId: params.listingId },
  });

  // Old staff (if any)
  if (params.oldStaffId && params.oldStaffId !== params.newStaffId) {
    await notifyStaff({
      staffId: params.oldStaffId,
      type: "listing_reassigned",
      title: "ملک از شما واگذار شد",
      body: `ملک «${params.listingTitle}» به کارشناس دیگری واگذار شد.`,
      data: { listingId: params.listingId },
    });
  }

  // User (property owner)
  await notifyUser({
    userId: params.userId,
    type: "listing_reassigned",
    title: "کارشناس ملک شما تغییر کرد",
    body: `کارشناس مسئول ملک «${params.listingTitle}» تغییر کرد.`,
    data: { listingId: params.listingId },
  });
}

/**
 * Notify on panorama added by user.
 */
export async function notifyPanoramaAdded(params: {
  assignedStaffId: number | null;
  listingId: number;
  listingTitle: string;
  userId: number;
  count: number;
}): Promise<void> {
  if (params.assignedStaffId) {
    await notifyStaff({
      staffId: params.assignedStaffId,
      type: "listing_panorama_added",
      title: "تصاویر 360 درجه اضافه شد",
      body: `${params.count} تصویر 360 درجه به ملک «${params.listingTitle}» اضافه شد.`,
      data: { listingId: params.listingId, userId: params.userId },
    });
  }
}
