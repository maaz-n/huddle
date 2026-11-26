import { and, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/db";
import {
  notifications,
  user,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { taskNotificationEmail } from "@/lib/email-templates";
import type { NotificationMetadata, NotificationType } from "@/types/types";

/**
 * Only the events people care about outside the app are emailed. Everything
 * else stays in the in-app bell to avoid turning the inbox into a feed.
 */
const EMAIL_NOTIFICATION_TYPES = new Set<NotificationType>([
  "task_assigned",
  "changes_requested",
]);

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

function appUrl() {
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

/**
 * Creates one in-app notification per recipient, then sends email for the
 * notification types that opt into it.
 *
 * Notification failures are logged but never thrown: a mutation that already
 * succeeded must not fail because its notification could not be written.
 */
export async function notifyUsers(input: NotifyUsersInput) {
  const {
    userIds,
    workspaceId,
    type,
    entityType,
    entityId,
    title,
    body,
    metadata,
  } = input;

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

  if (EMAIL_NOTIFICATION_TYPES.has(type)) {
    await sendNotificationEmails(input, recipients);
  }
}

async function sendNotificationEmails(
  input: NotifyUsersInput,
  recipients: string[],
) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const [workspace, people] = await Promise.all([
      db.query.workspaces.findFirst({
        where: eq(workspaces.id, input.workspaceId),
        columns: { name: true },
      }),
      db
        .select({
          id: user.id,
          email: user.email,
          name: user.name,
          emailNotifications: user.emailNotifications,
        })
        .from(user)
        .where(inArray(user.id, recipients)),
    ]);

    const workspaceName = workspace?.name ?? "your workspace";
    const url = `${appUrl()}/?workspace=${input.workspaceId}`;

    await Promise.allSettled(
      people
        .filter((person) => person.emailNotifications)
        .map((person) =>
          sendEmail({
            to: person.email,
            subject: `${input.title} — ${workspaceName}`,
            html: taskNotificationEmail({
              recipientName: person.name,
              title: input.title,
              taskTitle: input.metadata?.taskTitle ?? input.body,
              workspaceName,
              url,
            }),
          }),
        ),
    );
  } catch (error) {
    console.error(
      "[notifications] Could not send notification emails:",
      error,
    );
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
