import { and, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/db";
import { notifications, workspaceMembers } from "@/db/schema";
import type { NotificationMetadata, NotificationType } from "@/types/types";

export type NotifyUsersInput = {
  userIds: string[];
  workspaceId: string;
  type: NotificationType;
  entityType: "task" | "workspace";
  entityId: string;
  title: string;
  body?: string | null;
  metadata?: NotificationMetadata;
};

/**
 * Creates one notification per recipient.
 *
 * Notification failures are logged but never thrown: a mutation that already
 * succeeded must not fail because its notification could not be written.
 */
export async function notifyUsers({
  userIds,
  workspaceId,
  type,
  entityType,
  entityId,
  title,
  body,
  metadata,
}: NotifyUsersInput) {
  const recipients = Array.from(new Set(userIds.filter(Boolean)));
  if (recipients.length === 0) return;

  try {
    await db.insert(notifications).values(
      recipients.map((userId) => ({
        userId,
        workspaceId,
        type,
        entityType,
        entityId,
        title,
        body: body ?? null,
        metadata: metadata ?? null,
      })),
    );
  } catch (error) {
    console.error("[notifications] Could not create notifications:", error);
  }
}

/**
 * Returns the admins and owners of a workspace, optionally excluding the
 * user who triggered the event so people are never notified about their own
 * action.
 */
export async function getWorkspaceManagerIds(
  workspaceId: string,
  excludeUserId?: string,
) {
  try {
    const managers = await db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          inArray(workspaceMembers.role, ["admin", "owner"]),
          excludeUserId
            ? ne(workspaceMembers.userId, excludeUserId)
            : undefined,
        ),
      );

    return managers.map((manager) => manager.userId);
  } catch (error) {
    console.error("[notifications] Could not load workspace managers:", error);
    return [];
  }
}
