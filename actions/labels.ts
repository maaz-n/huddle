"use server";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { labels, taskLabels, tasks } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import {
  idSchema,
  labelColorSchema,
  nameSchema,
  taskLabelIdsSchema,
  validationMessage,
} from "@/lib/validation";
import type { LabelColor, LabelItem } from "@/types/types";

export async function getWorkspaceLabels(
  workspaceId: string,
): Promise<LabelItem[]> {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    if (!parsedWorkspaceId.success) return [];

    await requireWorkspaceAccess(parsedWorkspaceId.data, "member");

    const rows = await db
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
      })
      .from(labels)
      .where(eq(labels.workspaceId, parsedWorkspaceId.data))
      .orderBy(asc(labels.name));

    return rows as LabelItem[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createLabel(
  workspaceId: string,
  name: string,
  color: LabelColor,
) {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedName = nameSchema.safeParse(name);
    const parsedColor = labelColorSchema.safeParse(color);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedName.success) {
      return { success: false, message: validationMessage(parsedName.error) };
    }
    if (!parsedColor.success) {
      return { success: false, message: validationMessage(parsedColor.error) };
    }

    await requireWorkspaceAccess(parsedWorkspaceId.data, "admin");

    const existing = await db.query.labels.findFirst({
      where: and(
        eq(labels.workspaceId, parsedWorkspaceId.data),
        eq(labels.name, parsedName.data),
      ),
    });
    if (existing) {
      return {
        success: true,
        message: "Label already exists",
        label: existing as LabelItem,
      };
    }

    const [label] = await db
      .insert(labels)
      .values({
        workspaceId: parsedWorkspaceId.data,
        name: parsedName.data,
        color: parsedColor.data,
      })
      .returning();

    return {
      success: true,
      message: "Label created",
      label: label as LabelItem,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not create the label" };
  }
}

export async function deleteLabel(workspaceId: string, labelId: string) {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedLabelId = idSchema.safeParse(labelId);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedLabelId.success) {
      return {
        success: false,
        message: validationMessage(parsedLabelId.error),
      };
    }

    await requireWorkspaceAccess(parsedWorkspaceId.data, "admin");

    const deleted = await db
      .delete(labels)
      .where(
        and(
          eq(labels.id, parsedLabelId.data),
          eq(labels.workspaceId, parsedWorkspaceId.data),
        ),
      )
      .returning({ id: labels.id });

    if (deleted.length === 0) {
      return { success: false, message: "Label not found" };
    }

    return { success: true, message: "Label deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not delete the label" };
  }
}

export async function getTaskLabels(
  taskId: string,
  workspaceId: string,
): Promise<LabelItem[]> {
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

    const rows = await db
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
      })
      .from(taskLabels)
      .innerJoin(labels, eq(taskLabels.labelId, labels.id))
      .where(
        and(
          eq(taskLabels.taskId, parsedTaskId.data),
          eq(labels.workspaceId, parsedWorkspaceId.data),
        ),
      )
      .orderBy(asc(labels.name));

    return rows as LabelItem[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function setTaskLabels(
  taskId: string,
  workspaceId: string,
  labelIds: string[],
) {
  try {
    const parsedTaskId = idSchema.safeParse(taskId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedLabelIds = taskLabelIdsSchema.safeParse(labelIds);

    if (!parsedTaskId.success) {
      return { success: false, message: validationMessage(parsedTaskId.error) };
    }
    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedLabelIds.success) {
      return {
        success: false,
        message: validationMessage(parsedLabelIds.error),
      };
    }

    const { user: actor } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "admin",
    );

    const task = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, parsedTaskId.data),
        eq(tasks.workspaceId, parsedWorkspaceId.data),
      ),
      columns: { id: true, title: true },
    });
    if (!task) {
      return { success: false, message: "Task not found" };
    }

    const uniqueLabelIds = Array.from(new Set(parsedLabelIds.data));

    // Only labels that belong to this workspace may be attached.
    const validLabels = uniqueLabelIds.length
      ? await db
          .select({ id: labels.id })
          .from(labels)
          .where(
            and(
              eq(labels.workspaceId, parsedWorkspaceId.data),
              inArray(labels.id, uniqueLabelIds),
            ),
          )
      : [];

    await db.delete(taskLabels).where(eq(taskLabels.taskId, task.id));

    if (validLabels.length > 0) {
      await db.insert(taskLabels).values(
        validLabels.map((label) => ({
          taskId: task.id,
          labelId: label.id,
        })),
      );
    }

    await logActivity({
      workspaceId: parsedWorkspaceId.data,
      actorId: actor.id,
      entityType: "task",
      entityId: task.id,
      action: "TASK_LABELS_UPDATED",
      metadata: { entityName: task.title },
    });

    return {
      success: true,
      message: "Labels updated",
      labelIds: validLabels.map((label) => label.id),
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update the labels" };
  }
}
