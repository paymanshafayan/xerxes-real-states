import { db } from "@/db";
import { staff, chatSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Send an Expo push notification to a staff member.
 * Requires EXPO_PUSH_ACCESS_TOKEN; otherwise it is a no-op.
 */
export async function notifyStaffPush(
  staffId: number,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  const token = process.env.EXPO_PUSH_ACCESS_TOKEN;
  if (!token) return;
  try {
    const rows = await db
      .select({ pushToken: staff.pushToken })
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);
    const pushToken = rows[0]?.pushToken;
    if (!pushToken || !pushToken.startsWith("ExponentPushToken")) return;

    // @ts-ignore - optional dependency, only needed when push is configured
    const { Expo } = await import("expo-server-sdk");
    const expo = new Expo({ accessToken: token });
    const messages = [{ to: pushToken, sound: "default", title, body, data: data ?? {} }];
    await expo.sendPushNotificationsAsync(messages);
  } catch (err) {
    console.error("Push notify failed:", err);
  }
}

/**
 * Notify the staff member assigned to a chat session about a new visitor message.
 */
export async function notifySessionAssigned(sessionId: string): Promise<void> {
  try {
    const rows = await db
      .select({ assignedStaffId: chatSessions.assignedStaffId })
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId))
      .limit(1);
    const id = rows[0]?.assignedStaffId;
    if (id) {
      await notifyStaffPush(
        id,
        "Xerxes Chat",
        "You have a new message from a visitor.",
        { sessionId }
      );
    }
  } catch (err) {
    console.error("notifySessionAssigned failed:", err);
  }
}
