"use server";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { subtasks, tasks } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import {
  idSchema,
  taskTitleSchema,
  validationMessage,
} from "@/lib/validation";
import type { SubtaskItem } from "@/types/types";

const MAX_SUBTASKS_PER_TASK = 20;

export async function getSubtasks(
  taskId: string,
  workspaceId: string,
): Promise<SubtaskItem[]> {
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

    return await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, task.id))
      .orderBy(asc(subtasks.createdAt));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createSubtask(
  taskId: string,
  workspaceId: string,
  title: string,
) {
  try {
    const parsedTaskId = idSchema.safeParse(taskId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedTitle = taskTitleSchema.safeParse(title);

    if (!parsedTaskId.success) {
      return { success: false, message: validationMessage(parsedTaskId.error) };
    }
    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedTitle.success) {
      return { success: false, message: validationMessage(parsedTitle.error) };
    }

    const { user: actor } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "member",
    );

    const task = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, parsedTaskId.data),
        eq(tasks.workspaceId, parsedWorkspaceId.data),
      ),
      columns: { id: true },
    });
    if (!task) {
      return { success: false, message: "Task not found" };
    }

    const existing = await db.query.subtasks.findMany({
      where: eq(subtasks.taskId, task.id),
      columns: { id: true },
    });
    if (existing.length >= MAX_SUBTASKS_PER_TASK) {
      return {
        success: false,
        message: `A task can have at most ${MAX_SUBTASKS_PER_TASK} subtasks`,
      };
    }

    const [subtask] = await db
      .insert(subtasks)
      .values({
        taskId: task.id,
        workspaceId: parsedWorkspaceId.data,
        authorId: actor.id,
        title: parsedTitle.data,
      })
      .returning();

    await logActivity({
      workspaceId: parsedWorkspaceId.data,
      actorId: actor.id,
      entityType: "task",
      entityId: task.id,
      action: "SUBTASK_ADDED",
      metadata: { entityName: subtask.title },
    });

    return { success: true, message: "Subtask added", subtask };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not add the subtask" };
  }
}

export async function toggleSubtask(
  subtaskId: string,
  workspaceId: string,
  completed: boolean,
) {
  try {
    const parsedSubtaskId = idSchema.safeParse(subtaskId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);

    if (!parsedSubtaskId.success) {
      return {
        success: false,
        message: validationMessage(parsedSubtaskId.error),
      };
    }
    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }

    const { user: actor } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "member",
    );

    const subtask = await db.query.subtasks.findFirst({
      where: and(
        eq(subtasks.id, parsedSubtaskId.data),
        eq(subtasks.workspaceId, parsedWorkspaceId.data),
      ),
      columns: {
        id: true,
        taskId: true,
        title: true,
        completed: true,
      },
    });
    if (!subtask) {
      return { success: false, message: "Subtask not found" };
    }
    if (subtask.completed === completed) {
      return { success: true, message: "Subtask already up to date" };
    }

    await db
      .update(subtasks)
      .set({ completed, completedAt: completed ? new Date() : null })
      .where(eq(subtasks.id, subtask.id));

    await logActivity({
      workspaceId: parsedWorkspaceId.data,
      actorId: actor.id,
      entityType: "task",
      entityId: subtask.taskId,
      action: completed ? "SUBTASK_COMPLETED" : "SUBTASK_REOPENED",
      metadata: { entityName: subtask.title },
    });

    return { success: true, message: "Subtask updated" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update the subtask" };
  }
}

export async function deleteSubtask(subtaskId: string, workspaceId: string) {
  try {
    const parsedSubtaskId = idSchema.safeParse(subtaskId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);

    if (!parsedSubtaskId.success) {
      return {
        success: false,
        message: validationMessage(parsedSubtaskId.error),
      };
    }
    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }

    const { user: actor, role } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "member",
    );

    const subtask = await db.query.subtasks.findFirst({
      where: and(
        eq(subtasks.id, parsedSubtaskId.data),
        eq(subtasks.workspaceId, parsedWorkspaceId.data),
      ),
      columns: {
        id: true,
        taskId: true,
        title: true,
        authorId: true,
      },
    });
    if (!subtask) {
      return { success: false, message: "Subtask not found" };
    }
    if (subtask.authorId !== actor.id && role === "member") {
      return {
        success: false,
        message: "Only the author or a manager can delete this subtask",
      };
    }

    await db.delete(subtasks).where(eq(subtasks.id, subtask.id));

    await logActivity({
      workspaceId: parsedWorkspaceId.data,
      actorId: actor.id,
      entityType: "task",
      entityId: subtask.taskId,
      action: "SUBTASK_DELETED",
      metadata: { entityName: subtask.title },
    });

    return { success: true, message: "Subtask deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not delete the subtask" };
  }
}
