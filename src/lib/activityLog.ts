import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export type ActionType = "create" | "update" | "delete" | "login" | "register" | "view" | "seed" | "setting_change";
export type EntityType = "property" | "agent" | "user" | "inquiry" | "setting" | "admin" | "newsletter";

export async function logActivity(data: {
  action: ActionType;
  entity: EntityType;
  entityId?: number;
  details?: string;
  userId?: number;
  userName?: string;
  ip?: string;
}) {
  try {
    await db.insert(activityLogs).values({
      action: data.action,
      entity: data.entity,
      entityId: data.entityId || null,
      details: data.details || null,
      userId: data.userId || null,
      userName: data.userName || null,
      ip: data.ip || null,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getActivityLogs(limit = 50, offset = 0) {
  try {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);
  } catch {
    return [];
  }
}

export async function getActivityLogCount() {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs);
    return Number(result[0].count);
  } catch {
    return 0;
  }
}
