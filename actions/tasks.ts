"use server";

import { db } from "@/db";
import { tasks, activityLogs } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { eq } from "drizzle-orm";


export async function createTask(input: {
  workspaceId: string;
  title: string;
}) {
  const { user } = await requireWorkspaceAccess(
    input.workspaceId,
    "member"
  );

  await db.insert(tasks).values({
    workspaceId: input.workspaceId,
    title: input.title,
    createdBy: user.id,
  });

  await logActivity({
    workspaceId: input.workspaceId,
    actorId: user.id,
    entityType: "task",
    entityId: tasks[0].id,
    action: "Task created",
  });
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

  if (!allowedTransitions[task.status].includes(newStatus)) {
    throw new Error(`Invalid status transition: ${task.status} → ${newStatus}`);
  }

  // Update status
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
){
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

  })
}

export async function updateTaskDescription(
  taskId: string,
  workspaceId: string,
  newDescription: string,
){
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
  })
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
  })
}