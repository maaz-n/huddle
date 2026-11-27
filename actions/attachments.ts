"use server";

import { randomUUID } from "crypto";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { taskAttachments, tasks, user } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import {
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_TASK,
} from "@/lib/attachments";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { deleteObject, attachmentKey, putObject } from "@/lib/storage";
import { idSchema, validationMessage } from "@/lib/validation";
import type { TaskAttachment } from "@/types/types";

function sanitizeFileName(name: string) {
  const cleaned = name
    .replace(/[\\/]/g, "_")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 200);

  return cleaned || "attachment";
}

function sanitizeMimeType(type: string) {
  const cleaned = type.trim().slice(0, 150);
  return cleaned || "application/octet-stream";
}

export async function getTaskAttachments(
  taskId: string,
  workspaceId: string,
): Promise<TaskAttachment[]> {
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
        id: taskAttachments.id,
        fileName: taskAttachments.fileName,
        mimeType: taskAttachments.mimeType,
        size: taskAttachments.size,
        uploaderId: taskAttachments.uploaderId,
        uploaderName: user.name,
        createdAt: taskAttachments.createdAt,
      })
      .from(taskAttachments)
      .innerJoin(user, eq(taskAttachments.uploaderId, user.id))
      .where(eq(taskAttachments.taskId, task.id))
      .orderBy(asc(taskAttachments.createdAt));

    return rows;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function uploadTaskAttachment(
  taskId: string,
  workspaceId: string,
  formData: FormData,
) {
  let uploadedKey: string | null = null;

  try {
    const parsedTaskId = idSchema.safeParse(taskId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);

    if (!parsedTaskId.success) {
      return { success: false, message: validationMessage(parsedTaskId.error) };
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

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "Choose a file to attach" };
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { success: false, message: "Attachments must be 5 MB or smaller" };
    }

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

    const existing = await db.query.taskAttachments.findMany({
      where: eq(taskAttachments.taskId, task.id),
      columns: { id: true },
    });
    if (existing.length >= MAX_ATTACHMENTS_PER_TASK) {
      return {
        success: false,
        message: `A task can have at most ${MAX_ATTACHMENTS_PER_TASK} attachments`,
      };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const id = randomUUID();
    const key = attachmentKey(id);
    const mimeType = sanitizeMimeType(file.type);

    await putObject({ key, body: bytes, contentType: mimeType });
    uploadedKey = key;

    const [attachment] = await db
      .insert(taskAttachments)
      .values({
        id,
        taskId: task.id,
        workspaceId: parsedWorkspaceId.data,
        uploaderId: actor.id,
        fileName: sanitizeFileName(file.name),
        mimeType,
        size: bytes.length,
        objectKey: key,
      })
      .returning({
        id: taskAttachments.id,
        fileName: taskAttachments.fileName,
        mimeType: taskAttachments.mimeType,
        size: taskAttachments.size,
        uploaderId: taskAttachments.uploaderId,
        createdAt: taskAttachments.createdAt,
      });

    await logActivity({
      workspaceId: parsedWorkspaceId.data,
      actorId: actor.id,
      entityType: "task",
      entityId: task.id,
      action: "TASK_ATTACHMENT_ADDED",
      metadata: { entityName: attachment.fileName },
    });

    const uploader = await db.query.user.findFirst({
      where: eq(user.id, actor.id),
      columns: { name: true },
    });

    return {
      success: true,
      message: "Attachment added",
      attachment: {
        ...attachment,
        uploaderName: uploader?.name ?? "You",
      } as TaskAttachment,
    };
  } catch (error) {
    console.error(error);
    if (uploadedKey) {
      await deleteObject(uploadedKey).catch((cleanupError) =>
        console.error("[storage] Could not clean up attachment object:", cleanupError),
      );
    }
    return { success: false, message: "Could not upload the attachment" };
  }
}

export async function deleteTaskAttachment(
  attachmentId: string,
  workspaceId: string,
) {
  try {
    const parsedAttachmentId = idSchema.safeParse(attachmentId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);

    if (!parsedAttachmentId.success) {
      return {
        success: false,
        message: validationMessage(parsedAttachmentId.error),
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

    const attachment = await db.query.taskAttachments.findFirst({
      where: and(
        eq(taskAttachments.id, parsedAttachmentId.data),
        eq(taskAttachments.workspaceId, parsedWorkspaceId.data),
      ),
      columns: {
        id: true,
        taskId: true,
        fileName: true,
        uploaderId: true,
        objectKey: true,
      },
    });
    if (!attachment) {
      return { success: false, message: "Attachment not found" };
    }

    if (attachment.uploaderId !== actor.id && role === "member") {
      return {
        success: false,
        message: "Only the uploader or a manager can delete this attachment",
      };
    }

    await db
      .delete(taskAttachments)
      .where(eq(taskAttachments.id, attachment.id));

    try {
      await deleteObject(attachment.objectKey);
    } catch (error) {
      console.error("[storage] Could not delete attachment object:", error);
    }

    await logActivity({
      workspaceId: parsedWorkspaceId.data,
      actorId: actor.id,
      entityType: "task",
      entityId: attachment.taskId,
      action: "TASK_ATTACHMENT_REMOVED",
      metadata: { entityName: attachment.fileName },
    });

    return { success: true, message: "Attachment deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not delete the attachment" };
  }
}
