"use server";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { taskComments, tasks, user } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { notifyUsers } from "@/lib/notifications";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { commentSchema, idSchema, validationMessage } from "@/lib/validation";
import type { TaskComment } from "@/types/types";

async function findTaskInWorkspace(taskId: string, workspaceId: string) {
  return db.query.tasks.findFirst({
    where: and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)),
    columns: {
      id: true,
      title: true,
      assigneeId: true,
      createdBy: true,
    },
  });
}

export async function getTaskComments(
  taskId: string,
  workspaceId: string,
): Promise<TaskComment[]> {
  try {
    const parsedTaskId = idSchema.safeParse(taskId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    if (!parsedTaskId.success || !parsedWorkspaceId.success) return [];

    await requireWorkspaceAccess(parsedWorkspaceId.data, "member");

    const task = await findTaskInWorkspace(
      parsedTaskId.data,
      parsedWorkspaceId.data,
    );
    if (!task) return [];

    const rows = await db
      .select({
        id: taskComments.id,
        taskId: taskComments.taskId,
        workspaceId: taskComments.workspaceId,
        authorId: taskComments.authorId,
        body: taskComments.body,
        createdAt: taskComments.createdAt,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(taskComments)
      .innerJoin(user, eq(taskComments.authorId, user.id))
      .where(
        and(
          eq(taskComments.taskId, parsedTaskId.data),
          eq(taskComments.workspaceId, parsedWorkspaceId.data),
        ),
      )
      .orderBy(asc(taskComments.createdAt));

    return rows.map((row) => ({
      id: row.id,
      taskId: row.taskId,
      workspaceId: row.workspaceId,
      authorId: row.authorId,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      author: {
        id: row.authorId,
        name: row.authorName,
        image: row.authorImage,
      },
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function addTaskComment(
  taskId: string,
  workspaceId: string,
  body: string,
) {
  try {
    const parsedTaskId = idSchema.safeParse(taskId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedBody = commentSchema.safeParse(body);

    if (!parsedTaskId.success) {
      return { success: false, message: validationMessage(parsedTaskId.error) };
    }
    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedBody.success) {
      return { success: false, message: validationMessage(parsedBody.error) };
    }

    const { user: actor } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "member",
    );

    const task = await findTaskInWorkspace(
      parsedTaskId.data,
      parsedWorkspaceId.data,
    );
    if (!task) {
      return { success: false, message: "Task not found" };
    }

    const [inserted] = await db
      .insert(taskComments)
      .values({
        taskId: parsedTaskId.data,
        workspaceId: parsedWorkspaceId.data,
        authorId: actor.id,
        body: parsedBody.data,
      })
      .returning();

    const author = await db.query.user.findFirst({
      where: eq(user.id, actor.id),
      columns: { name: true, image: true },
    });

    await logActivity({
      workspaceId: parsedWorkspaceId.data,
      actorId: actor.id,
      entityType: "task",
      entityId: parsedTaskId.data,
      action: "TASK_COMMENT_ADDED",
      metadata: { entityName: task.title, comment: parsedBody.data },
    });

    const recipients = Array.from(
      new Set([task.assigneeId, task.createdBy]),
    ).filter((userId) => userId !== actor.id);

    await notifyUsers({
      userIds: recipients,
      workspaceId: parsedWorkspaceId.data,
      type: "task_comment",
      entityType: "task",
      entityId: parsedTaskId.data,
      title: "New comment on a task",
      body: task.title,
      metadata: {
        taskId: parsedTaskId.data,
        taskTitle: task.title,
        comment: parsedBody.data.slice(0, 140),
      },
    });

    const comment: TaskComment = {
      id: inserted.id,
      taskId: inserted.taskId,
      workspaceId: inserted.workspaceId,
      authorId: inserted.authorId,
      body: inserted.body,
      createdAt: inserted.createdAt.toISOString(),
      author: {
        id: actor.id,
        name: author?.name ?? "A teammate",
        image: author?.image ?? null,
      },
    };

    return { success: true, message: "Comment added", comment };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not add comment" };
  }
}

export async function deleteTaskComment(
  commentId: string,
  workspaceId: string,
) {
  try {
    const parsedCommentId = idSchema.safeParse(commentId);
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);

    if (!parsedCommentId.success) {
      return {
        success: false,
        message: validationMessage(parsedCommentId.error),
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

    const comment = await db.query.taskComments.findFirst({
      where: and(
        eq(taskComments.id, parsedCommentId.data),
        eq(taskComments.workspaceId, parsedWorkspaceId.data),
      ),
    });

    if (!comment) {
      return { success: false, message: "Comment not found" };
    }

    if (comment.authorId !== actor.id && role === "member") {
      return {
        success: false,
        message: "You can only delete your own comments",
      };
    }

    await db
      .delete(taskComments)
      .where(
        and(
          eq(taskComments.id, parsedCommentId.data),
          eq(taskComments.workspaceId, parsedWorkspaceId.data),
        ),
      );

    return { success: true, message: "Comment deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not delete comment" };
  }
}
