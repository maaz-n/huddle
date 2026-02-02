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
        orderBy: (tasks, { desc }) => desc(tasks.updatedAt)
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
      ),
      
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
  status: "todo" | "in_review" | "done",
  priority: "low" | "medium" | "high",
  assigneeId: string,
  dueDate: string | undefined
) {
  const { user } = await requireWorkspaceAccess(
    workspaceId,
    "member"
  );

  try {

    if (!assigneeId) return { success: false, message: "Please select an assignee" }
    if (!dueDate) return { success: false, message: "Please select a due date" }
    
    const [insertedTask] = await db.insert(tasks).values({
      workspaceId: workspaceId,
      title: title,
      description: description,
      status: status,
      priority: priority,
      dueDate: dueDate,
      assigneeId: assigneeId,
      createdBy: user.id,
    }).returning();

    await logActivity({
      workspaceId: workspaceId,
      actorId: user.id,
      entityType: "task",
      entityId: insertedTask.id,
      action: "TASK_CREATE",
      metadata: { entityName: insertedTask.title }
    });

    return { success: true, message: "Task created!" }

  } catch (error) {
    console.error(error)
    return { success: false, message: "Error creating task" }

  }
}

export async function updateTaskStatus(
  taskId: string,
  workspaceId: string,
  newStatus: "todo" | "in_review" | "done"
) {
  const { user, role } = await requireWorkspaceAccess(workspaceId, "member");

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task) return { success: false, message: "Task not found" }

  const canChange = task.assigneeId === user.id || role !== "member"

  if (!canChange) return { success: false, message: "Unauthorized" }

  const currentStatus = task.status;
  if (currentStatus == null) {
    return { success: false, message: "Task has no status" }
  }

  await db.update(tasks)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));

  await db.insert(activityLogs).values({
    workspaceId,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
    action: "TASK_STATUS_CHANGE",
    metadata: {
      oldStatus: task.status,
      newStatus: newStatus,
    }
  });

  return { success: true, message: "Task status updated!" }
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

export async function addRevisionNote(
  taskId: string,
  workspaceId: string,
  note: string,
) {
  const { user } = await requireWorkspaceAccess(workspaceId, "member");
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId)
  });

  if (!task) throw new Error("No task found!")

  await db.update(tasks).set(
    {
      revisionNote: note,
      updatedAt: new Date(),
    }
  ).where(eq(tasks.id, taskId))

  await logActivity({
    workspaceId: workspaceId,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
    action: "Revision note added",
    metadata: { entityName: note }
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
    action: `TASK_ASSIGNED`,
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