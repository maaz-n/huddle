"use server";

import { db } from "@/db";
import { tasks, activityLogs, user, workspaceMembers } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { canTransition } from "@/lib/task-workflow";
import {
  createTaskSchema,
  idSchema,
  noteSchema,
  taskDescriptionSchema,
  taskStatusSchema,
  taskTitleSchema,
  validationMessage,
} from "@/lib/validation";
import { GetFilteredTasks, UserTypeNew } from "@/types/types";
import { and, eq, sql } from "drizzle-orm";

export async function getTasks(workspaceId: string, filter: GetFilteredTasks) {
  await requireWorkspaceAccess(workspaceId, "member");
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
              image: true,
            },
          },
        },
        orderBy: (tasks, { desc }) => desc(tasks.updatedAt),
      });
    } else {
      return await db.query.tasks.findMany({
        where: (tasks, { eq, and }) => {
          const conditions = [eq(tasks.workspaceId, workspaceId)];

          if (filter.status) {
            conditions.push(eq(tasks.status, filter.status));
          }
          if (filter.priority) {
            conditions.push(eq(tasks.priority, filter.priority));
          }
          if (filter.assignee) {
            conditions.push(eq(tasks.assigneeId, filter.assignee));
          }

          return and(...conditions);
        },

        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: (tasks, { desc }) => desc(tasks.updatedAt),
      });
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getMyTasks(workspaceId: string) {
  const { user } = await requireWorkspaceAccess(workspaceId, "member");
  try {
    const workspaceTasks = await db.query.tasks.findMany({
      where: (tasks, { eq, and }) =>
        and(eq(tasks.workspaceId, workspaceId), eq(tasks.assigneeId, user.id)),

      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    return workspaceTasks;
  } catch (error) {
    console.error(error);
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
  dueDate: string,
) {
  const parsed = createTaskSchema.safeParse({
    workspaceId,
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
  });

  if (!parsed.success) {
    return { success: false, message: validationMessage(parsed.error) };
  }

  const { user } = await requireWorkspaceAccess(parsed.data.workspaceId, "member");

  try {
    const [validAssignee] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, parsed.data.assigneeId),
          eq(workspaceMembers.workspaceId, parsed.data.workspaceId),
        ),
      );
    if (!validAssignee)
      return {
        success: false,
        message: "Assignee does not belong to the workspace",
      };

    const [insertedTask] = await db
      .insert(tasks)
      .values({
        workspaceId: parsed.data.workspaceId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        status: parsed.data.status,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate,
        assigneeId: parsed.data.assigneeId,
        createdBy: user.id,
      })
      .returning();

    await logActivity({
      workspaceId: parsed.data.workspaceId,
      actorId: user.id,
      entityType: "task",
      entityId: insertedTask.id,
      action: "TASK_CREATE",
      metadata: { entityName: insertedTask.title },
    });

    return { success: true, message: "Task created!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating task" };
  }
}

export async function deleteTask(workspaceId: string, taskId: string) {
  const parsedWorkspaceId = idSchema.safeParse(workspaceId);
  const parsedTaskId = idSchema.safeParse(taskId);

  if (!parsedWorkspaceId.success) {
    return {
      success: false,
      message: validationMessage(parsedWorkspaceId.error),
    };
  }
  if (!parsedTaskId.success) {
    return { success: false, message: validationMessage(parsedTaskId.error) };
  }

  const { user } = await requireWorkspaceAccess(
    parsedWorkspaceId.data,
    "admin",
  );

  try {
    const deletedTask = await db
      .delete(tasks)
      .where(
        and(
          eq(tasks.id, parsedTaskId.data),
          eq(tasks.workspaceId, parsedWorkspaceId.data),
        ),
      )
      .returning();

    if (!deletedTask[0]) {
      return { success: false, message: "Task not found" };
    }

    await db.insert(activityLogs).values({
      workspaceId: parsedWorkspaceId.data,
      actorId: user.id,
      entityType: "task",
      entityId: parsedTaskId.data,
      action: "TASK_DELETED",
      metadata: {
        entityName: deletedTask[0].title,
      },
    });

    return { success: true, message: "Task deleted!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "There was an error deleting the task" };
  }
}

export async function updateTaskStatus(
  taskId: string,
  workspaceId: string,
  newStatus: "todo" | "in_review" | "done",
) {
  const parsedTaskId = idSchema.safeParse(taskId);
  const parsedWorkspaceId = idSchema.safeParse(workspaceId);
  const parsedStatus = taskStatusSchema.safeParse(newStatus);

  if (!parsedTaskId.success) {
    return { success: false, message: validationMessage(parsedTaskId.error) };
  }
  if (!parsedWorkspaceId.success) {
    return {
      success: false,
      message: validationMessage(parsedWorkspaceId.error),
    };
  }
  if (!parsedStatus.success) {
    return { success: false, message: validationMessage(parsedStatus.error) };
  }

  const { user, role } = await requireWorkspaceAccess(
    parsedWorkspaceId.data,
    "member",
  );

  const task = await getTaskInWorkspace(
    parsedTaskId.data,
    parsedWorkspaceId.data,
  );

  if (!task) return { success: false, message: "Task not found" };

  const allowed = canTransition({
    role,
    isAssignee: task.assigneeId === user.id,
    from: task.status,
    to: parsedStatus.data,
  });

  if (!allowed) {
    return {
      success: false,
      message: "That status change is not allowed",
    };
  }

  await db
    .update(tasks)
    .set({ status: parsedStatus.data, updatedAt: new Date() })
    .where(
      and(
        eq(tasks.id, parsedTaskId.data),
        eq(tasks.workspaceId, parsedWorkspaceId.data),
      ),
    );

  await db.insert(activityLogs).values({
    workspaceId: parsedWorkspaceId.data,
    actorId: user.id,
    entityType: "task",
    entityId: parsedTaskId.data,
    action: "TASK_STATUS_CHANGE",
    metadata: {
      oldStatus: task.status,
      newStatus: parsedStatus.data,
    },
  });

  return { success: true, message: "Task status updated!" };
}

export async function updateTaskTitle(
  taskId: string,
  workspaceId: string,
  newTitle: string,
) {
  const parsedTaskId = idSchema.safeParse(taskId);
  const parsedWorkspaceId = idSchema.safeParse(workspaceId);
  const parsedTitle = taskTitleSchema.safeParse(newTitle);

  if (!parsedTaskId.success) {
    throw new Error(validationMessage(parsedTaskId.error));
  }
  if (!parsedWorkspaceId.success) {
    throw new Error(validationMessage(parsedWorkspaceId.error));
  }
  if (!parsedTitle.success) {
    throw new Error(validationMessage(parsedTitle.error));
  }

  const { user } = await requireWorkspaceAccess(
    parsedWorkspaceId.data,
    "member",
  );
  const task = await getTaskInWorkspace(
    parsedTaskId.data,
    parsedWorkspaceId.data,
  );

  if (!task) throw new Error("No task found!");

  await db
    .update(tasks)
    .set({
      title: parsedTitle.data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tasks.id, parsedTaskId.data),
        eq(tasks.workspaceId, parsedWorkspaceId.data),
      ),
    );

  await logActivity({
    workspaceId: parsedWorkspaceId.data,
    actorId: user.id,
    entityType: "task",
    entityId: parsedTaskId.data,
    action: "Title updated",
    metadata: { entityName: task.title },
  });
}

export async function updateTaskDescription(
  taskId: string,
  workspaceId: string,
  newDescription: string,
) {
  const parsedTaskId = idSchema.safeParse(taskId);
  const parsedWorkspaceId = idSchema.safeParse(workspaceId);
  const parsedDescription = taskDescriptionSchema.safeParse(newDescription);

  if (!parsedTaskId.success) {
    throw new Error(validationMessage(parsedTaskId.error));
  }
  if (!parsedWorkspaceId.success) {
    throw new Error(validationMessage(parsedWorkspaceId.error));
  }
  if (!parsedDescription.success) {
    throw new Error(validationMessage(parsedDescription.error));
  }

  const { user } = await requireWorkspaceAccess(
    parsedWorkspaceId.data,
    "member",
  );
  const task = await getTaskInWorkspace(
    parsedTaskId.data,
    parsedWorkspaceId.data,
  );

  if (!task) throw new Error("No task found!");

  await db
    .update(tasks)
    .set({
      description: parsedDescription.data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tasks.id, parsedTaskId.data),
        eq(tasks.workspaceId, parsedWorkspaceId.data),
      ),
    );

  await logActivity({
    workspaceId: parsedWorkspaceId.data,
    actorId: user.id,
    entityType: "task",
    entityId: parsedTaskId.data,
    action: "Description updated",
    metadata: { entityName: task.title },
  });
}

export async function addRevisionNote(
  taskId: string,
  workspaceId: string,
  note: string,
) {
  const parsedTaskId = idSchema.safeParse(taskId);
  const parsedWorkspaceId = idSchema.safeParse(workspaceId);
  const parsedNote = noteSchema.safeParse(note);

  if (!parsedTaskId.success) {
    throw new Error(validationMessage(parsedTaskId.error));
  }
  if (!parsedWorkspaceId.success) {
    throw new Error(validationMessage(parsedWorkspaceId.error));
  }
  if (!parsedNote.success) {
    throw new Error(validationMessage(parsedNote.error));
  }

  const { user } = await requireWorkspaceAccess(
    parsedWorkspaceId.data,
    "admin",
  );
  const task = await getTaskInWorkspace(
    parsedTaskId.data,
    parsedWorkspaceId.data,
  );

  if (!task) throw new Error("No task found!");

  await db
    .update(tasks)
    .set({
      revisionNote: parsedNote.data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tasks.id, parsedTaskId.data),
        eq(tasks.workspaceId, parsedWorkspaceId.data),
      ),
    );

  await logActivity({
    workspaceId: parsedWorkspaceId.data,
    actorId: user.id,
    entityType: "task",
    entityId: parsedTaskId.data,
    action: "Revision note added",
    metadata: { entityName: note },
  });
}

export async function assignTask(
  taskId: string,
  workspaceId: string,
  assigneeId: string,
) {
  const parsedTaskId = idSchema.safeParse(taskId);
  const parsedWorkspaceId = idSchema.safeParse(workspaceId);
  const parsedAssigneeId = idSchema.safeParse(assigneeId);

  if (!parsedTaskId.success) {
    throw new Error(validationMessage(parsedTaskId.error));
  }
  if (!parsedWorkspaceId.success) {
    throw new Error(validationMessage(parsedWorkspaceId.error));
  }
  if (!parsedAssigneeId.success) {
    throw new Error(validationMessage(parsedAssigneeId.error));
  }

  const { user } = await requireWorkspaceAccess(
    parsedWorkspaceId.data,
    "admin",
  );

  const task = await getTaskInWorkspace(
    parsedTaskId.data,
    parsedWorkspaceId.data,
  );

  const [validAssignee] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, parsedAssigneeId.data),
        eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
      ),
    );
  if (!validAssignee)
    return {
      success: false,
      message: "Assignee does not belong to the workspace",
    };

  if (!task) throw new Error("Task not found!");

  await db
    .update(tasks)
    .set({
      assigneeId: parsedAssigneeId.data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tasks.id, parsedTaskId.data),
        eq(tasks.workspaceId, parsedWorkspaceId.data),
      ),
    );

  await logActivity({
    workspaceId: parsedWorkspaceId.data,
    actorId: user.id,
    entityType: "task",
    entityId: parsedTaskId.data,
    action: `TASK_ASSIGNED`,
    metadata: { entityName: task.title },
  });
}

export async function getUsers(workspaceId: string): Promise<UserTypeNew[]> {
  await requireWorkspaceAccess(workspaceId, "member");
  try {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: workspaceMembers.role,
      })
      .from(user)
      .innerJoin(workspaceMembers, eq(workspaceMembers.userId, user.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    return users;
  } catch (error) {
    throw error;
  }
}

export async function getUser(id: string) {
  try {
    return await db.query.user.findFirst({
      where: eq(user.id, id),
    });
  } catch (error) {
    throw error;
  }
}

export async function getTaskStats(workspaceId: string) {
  const { user } = await requireWorkspaceAccess(workspaceId, "member");
  return await db
    .select({
      status: tasks.status,
      count: sql<number>`count(*)`,
    })
    .from(tasks)
    .where(
      and(eq(tasks.workspaceId, workspaceId), eq(tasks.assigneeId, user.id)),
    )
    .groupBy(tasks.status);
}

async function getTaskInWorkspace(taskId: string, workspaceId: string) {
  try {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), eq(tasks.id, taskId)))
      .limit(1);
    if (!task) return;
    return task;
  } catch (error) {
    console.error(error);
    return null;
  }
}
