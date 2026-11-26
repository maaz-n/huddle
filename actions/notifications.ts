"use server";

import { and, count, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/authguard";
import { idSchema, validationMessage } from "@/lib/validation";
import type { NotificationItem } from "@/types/types";

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 50;

function toNotificationItem(
  row: typeof notifications.$inferSelect,
): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    workspaceId: row.workspaceId,
    entityType: row.entityType,
    entityId: row.entityId,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getNotifications(
  limit: number = DEFAULT_LIMIT,
): Promise<NotificationItem[]> {
  try {
    const user = await requireUser();
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(safeLimit);

    return rows.map(toNotificationItem);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const user = await requireUser();
    const [row] = await db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, user.id), isNull(notifications.readAt)),
      );

    return Number(row?.value ?? 0);
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const parsedId = idSchema.safeParse(notificationId);
    if (!parsedId.success) {
      return { success: false, message: validationMessage(parsedId.error) };
    }

    const user = await requireUser();
    const updated = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, parsedId.data),
          eq(notifications.userId, user.id),
        ),
      )
      .returning({ id: notifications.id });

    if (updated.length === 0) {
      return { success: false, message: "Notification not found" };
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update notification" };
  }
}

export async function markAllNotificationsRead() {
  try {
    const user = await requireUser();
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(eq(notifications.userId, user.id), isNull(notifications.readAt)),
      );

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update notifications" };
  }
}
