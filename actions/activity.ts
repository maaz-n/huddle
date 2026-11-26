"use server";

import { db } from "@/db";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";
import { activityLogs, tasks } from "@/db/schema";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { idSchema } from "@/lib/validation";
import type { ActivityItem } from "@/types/types";

type ActivityLog = typeof activityLogs.$inferSelect;

async function toActivityItems(logs: ActivityLog[]): Promise<ActivityItem[]> {
  const userIds = [...new Set(logs.map((log) => log.actorId))];

  const users = await db.query.user.findMany({
    where: (user, { inArray }) => inArray(user.id, userIds),
  });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return logs.map((log) => ({
    id: log.id,
    actor: {
      name: userMap[log.actorId]?.name ?? "Unknown",
      image: userMap[log.actorId]?.image,
    },
    action: log.action,
    entityType: log.entityType,
    entityName: log.metadata?.entityName ?? "",
    timestamp: log.createdAt,
    metadata: log.metadata,
  }));
}

/**
 * Newest-first log of everything that happened to one task. Used by the
 * activity section of the task detail modal.
 */
export async function getTaskActivity(
  taskId: string,
  workspaceId: string,
): Promise<ActivityItem[]> {
  try {
    const parsedTaskId = idSchema.safeParse(taskId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    if (!parsedTaskId.success || !parsedWorkspaceId.success) return [];

    await requireWorkspaceAccess(parsedWorkspaceId.data, "member");

    const task = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, parsedTaskId.data),
        eq(tasks.workspaceId, parsedWorkspaceId.data),
      ),
      columns: { id: true },
    });
    if (!task) return [];

    const logs = await db.query.activityLogs.findMany({
      where: (activityLogs, { and, eq }) =>
        and(
          eq(activityLogs.workspaceId, parsedWorkspaceId.data),
          eq(activityLogs.entityType, "task"),
          eq(activityLogs.entityId, parsedTaskId.data),
        ),
      orderBy: (activityLogs, { desc }) => desc(activityLogs.createdAt),
      limit: 50,
    });

    return await toActivityItems(logs);
  } catch (error) {
    console.error(error);
    return [];
  }
}

/**
 * Newest-first workspace-wide activity feed. Supports simple offset paging
 * for the dedicated activity page's "Load more" button.
 */
export async function getWorkspaceActivity(
  workspaceId: string,
  limit = 30,
  offset = 0,
): Promise<ActivityItem[]> {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    if (!parsedWorkspaceId.success) return [];

    await requireWorkspaceAccess(parsedWorkspaceId.data, "member");

    const logs = await db.query.activityLogs.findMany({
      where: (activityLogs, { eq }) =>
        eq(activityLogs.workspaceId, parsedWorkspaceId.data),
      orderBy: (activityLogs, { desc }) => desc(activityLogs.createdAt),
      limit: Math.min(Math.max(limit, 1), 100),
      offset: Math.max(offset, 0),
    });

    return await toActivityItems(logs);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getRecentActivity(workspaceId: string) {
  await requireWorkspaceAccess(workspaceId, "member");
  const logs = await db.query.activityLogs.findMany({
    where: (activityLogs, { eq }) => eq(activityLogs.workspaceId, workspaceId),
    orderBy: (activityLogs, { desc }) => desc(activityLogs.createdAt),
    limit: 5,
  });

  return toActivityItems(logs);
}


export async function getDashboardStats(userId: string, workspaceId: string) {
  await requireWorkspaceAccess(workspaceId, "member");
  const now = new Date();
  
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString(); 

  const tasksDueToday = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.assigneeId, userId),
        eq(tasks.workspaceId, workspaceId),
        gte(tasks.dueDate, todayStart),
        lte(tasks.dueDate, todayEnd), 
        ne(tasks.status, "done")   
      )
    );

  return tasksDueToday.length;
}
