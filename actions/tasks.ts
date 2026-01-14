"use server";

import { db } from "@/db";
import { tasks, activityLogs, user, workspaceMembers } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { GetFilteredTasks, UserTypeNew } from "@/types/types";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "./auth";

export async function getTasks(workspaceId: string, filter: GetFilteredTasks) {
  try {
    if (!filter.status && !filter.priority && !filter.assignee) {
      return await db.query.tasks.findMany({
        where: (tasks, { eq }) => eq(tasks.workspaceId, workspaceId),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
        },
        orderBy: ( tasks, { desc } ) => desc(tasks.updatedAt)
      })
    } else {
      return await db.query.tasks.findMany({
        where: (tasks, { eq, and }) => {
          const conditions = [];

          if (filter.status) {
            conditions.push(eq(tasks.status, filter.status));
          }
          if (filter.priority) {
            conditions.push(eq(tasks.priority, filter.priority));
          }
          if (filter.assignee) {
            conditions.push(eq(tasks.assigneeId, filter.assignee));
          }

          return and(...conditions)
        },

        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
        }
      })
    }
  } catch (error) {
    console.error(error);
    return []
  }
}

export async function getMyTasks(workspaceId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    const workspaceTasks = await db.query.tasks.findMany({
      where: (tasks, { eq, and }) => and(
        eq(tasks.workspaceId, workspaceId),
        eq(tasks.assigneeId, currentUser.id)
      )
    })
    return workspaceTasks;

  } catch (error) {
    console.error(error)
    return [];
  }
}

export async function createTask(
  workspaceId: string,
  title: string,
  description: string | null,
  status: "todo" | "in_progress" | "blocked" | "done",
  priority: "low" | "medium" | "high",
  assigneeId: string
) {
  const { user } = await requireWorkspaceAccess(
    workspaceId,
    "member"
  );

  try {

    const [insertedTask] = await db.insert(tasks).values({
      workspaceId: workspaceId,
      title: title,
      description: description,
      status: status,
      priority: priority,
      createdBy: user.id,
      assigneeId: assigneeId
    }).returning();

    await logActivity({
      workspaceId: workspaceId,
      actorId: user.id,
      entityType: "task",
      entityId: insertedTask.id,
      action: "Task created",
      metadata: { entityName: insertedTask.title }
    });

    return { success: true, message: "Task created!" }

  } catch (error) {
    const e = error as Error;
    return { success: false, message: e.message }

  }
}

export async function updateTaskStatus(
  taskId: string,
  workspaceId: string,
  newStatus: "todo" | "in_progress" | "blocked" | "done"
) {
  const { user } = await requireWorkspaceAccess(workspaceId, "member");

  // Fetch current status
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task) throw new Error("Task not found");

  // Validate transition
  const allowedTransitions: Record<string, string[]> = {
    todo: ["in_progress", "blocked"],
    in_progress: ["blocked", "done"],
    blocked: ["in_progress"],
    done: [],
  };

  // EDITED USING COPILOT
  const currentStatus = task.status;
  if (currentStatus == null) {
    throw new Error("Task has no status");
  }

  if (!allowedTransitions[currentStatus].includes(newStatus)) {
    throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}`);
  }

  await db.update(tasks)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  // Log activity
  await db.insert(activityLogs).values({
    workspaceId,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
    action: `Status changed: ${task.status} → ${newStatus}`,
  });
}

export async function updateTaskTitle(
  taskId: string,
  workspaceId: string,
  newTitle: string,
) {
  const { user } = await requireWorkspaceAccess(workspaceId, "member");
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });

  if (!task) throw new Error("No task found!")

  await db.update(tasks).set(
    {
      title: newTitle,
      updatedAt: new Date(),
    }
  )
    .where(eq(tasks.id, taskId))

  await logActivity({
    workspaceId: workspaceId,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
    action: "Title updated",
    metadata: { entityName: task.title }
  })
}

export async function updateTaskDescription(
  taskId: string,
  workspaceId: string,
  newDescription: string,
) {
  const { user } = await requireWorkspaceAccess(workspaceId, "member");
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });

  if (!task) throw new Error("No task found!")

  await db.update(tasks).set(
    {
      description: newDescription,
      updatedAt: new Date(),
    }
  ).where(eq(tasks.id, taskId))

  await logActivity({
    workspaceId: workspaceId,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
    action: "Description updated",
    metadata: { entityName: task.title }
  });
}

export async function assignTask(
  taskId: string,
  workspaceId: string,
  assigneeId: string
) {
  const { user } = await requireWorkspaceAccess(workspaceId, "admin");

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  })

  if (!task) throw new Error("Task not found!");

  await db.update(tasks).set({
    assigneeId: assigneeId,
    updatedAt: new Date(),
  }).where(eq(tasks.id, taskId));

  await logActivity({
    workspaceId: workspaceId,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
    action: `Assigned to ${assigneeId}`,
    metadata: { entityName: task.title }
  });
}

export async function getUsers(workspaceId: string): Promise<UserTypeNew[]> {
  try {

    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: workspaceMembers.role
    })
      .from(user)
      .innerJoin(workspaceMembers, eq(workspaceMembers.userId, user.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId))
    return users;

  } catch (error) {
    throw error;
  }
}

export async function getUser(id: string) {
  try {
    return await db.query.user.findFirst({
      where: eq(user.id, id)
    })
  } catch (error) {
    throw error;
  }
}

export async function getTaskStats(workspaceId: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  return await db
    .select({
      status: tasks.status,
      count: sql<number>`count(*)`,
    })
    .from(tasks)
    .where(and(
      eq(tasks.workspaceId, workspaceId),
      eq(tasks.assigneeId, user.id)
    ))
    .groupBy(tasks.status)
}