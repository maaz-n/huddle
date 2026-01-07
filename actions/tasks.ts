"use server";

import { db } from "@/db";
import { tasks, activityLogs } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireWorkspaceAccess } from "@/lib/workspace-access";


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
    where: tasks.id.eq(taskId),
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
    .where(tasks.id.eq(taskId));

  // Log activity
  await db.insert(activityLogs).values({
    workspaceId,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
    action: `Status changed: ${task.status} → ${newStatus}`,
  });
}