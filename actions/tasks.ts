"use server";

import { db } from "@/db";
import { tasks, activityLogs, user, workspaceMembers } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { getWorkspaceManagerIds, notifyUsers } from "@/lib/notifications";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { canTransition } from "@/lib/task-workflow";
import {
  createTaskSchema,
  idSchema,
  noteSchema,
  taskDescriptionSchema,
  taskIdListSchema,
  taskStatusSchema,
  taskTitleSchema,
  validationMessage,
} from "@/lib/validation";
import { GetFilteredTasks, UserTypeNew } from "@/types/types";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";

/**
 * Wildcards are escaped so a search for "%" matches a literal percent sign
 * instead of every task. PostgreSQL's default escape character is backslash.
 */
function searchPattern(search: string | undefined) {
  const term = (search ?? "").trim().slice(0, 100).replace(/[\\%_]/g, "\\$&");
  return `%${term}%`;
}

function taskConditions(workspaceId: string, filter: GetFilteredTasks) {
  const conditions = [eq(tasks.workspaceId, workspaceId)];

  if (filter.status) conditions.push(eq(tasks.status, filter.status));
  if (filter.priority) conditions.push(eq(tasks.priority, filter.priority));
  if (filter.assignee) conditions.push(eq(tasks.assigneeId, filter.assignee));
  if (filter.search?.trim()) {
    conditions.push(ilike(tasks.title, searchPattern(filter.search)));
  }

  return conditions;
}

function taskOrderBy(filter: GetFilteredTasks) {
  switch (filter.sort) {
    case "title":
      return [asc(tasks.title)];
    case "due":
      return [asc(tasks.dueDate), desc(tasks.updatedAt)];
    case "priority":
      return [
        sql`case when ${tasks.priority} = 'high' then 0 when ${tasks.priority} = 'medium' then 1 else 2 end asc`,
        desc(tasks.updatedAt),
      ];
    default:
      return [desc(tasks.updatedAt)];
  }
}

/**
 * Tasks visible in the workspace, with optional search, sort and offset
 * paging. Omitting `pageSize` returns the whole set, which older callers rely
 * on.
 */
export async function getTasks(
  workspaceId: string,
  filter: GetFilteredTasks,
  options?: { page?: number; pageSize?: number },
) {
  await requireWorkspaceAccess(workspaceId, "member");
  try {
    const pageSize = options?.pageSize;
    const offset =
      pageSize && options?.page
        ? (Math.max(options.page, 1) - 1) * pageSize
        : undefined;

    return await db.query.tasks.findMany({
      where: and(...taskConditions(workspaceId, filter)),
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
      orderBy: taskOrderBy(filter),
      limit: pageSize,
      offset,
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Total number of tasks matching the current filters, for page counts. */
export async function getTaskCount(
  workspaceId: string,
  filter: GetFilteredTasks,
) {
  await requireWorkspaceAccess(workspaceId, "member");
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(and(...taskConditions(workspaceId, filter)));

    return result?.count ?? 0;
  } catch (error) {
    console.error(error);
    return 0;
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

  const { user } = await requireWorkspaceAccess(
    parsed.data.workspaceId,
    "admin",
  );

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

    if (insertedTask.assigneeId !== user.id) {
      await notifyUsers({
        userIds: [insertedTask.assigneeId],
        workspaceId: parsed.data.workspaceId,
        type: "task_assigned",
        entityType: "task",
        entityId: insertedTask.id,
        title: "New task assigned to you",
        body: insertedTask.title,
        metadata: {
          taskId: insertedTask.id,
          taskTitle: insertedTask.title,
        },
      });
    }

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

export async function bulkUpdateTaskStatus(
  workspaceId: string,
  taskIds: string[],
  newStatus: "todo" | "in_review" | "done",
) {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedStatus = taskStatusSchema.safeParse(newStatus);
    const parsedIds = taskIdListSchema.safeParse(taskIds);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedStatus.success) {
      return { success: false, message: validationMessage(parsedStatus.error) };
    }
    if (!parsedIds.success) {
      return { success: false, message: validationMessage(parsedIds.error) };
    }

    const { user, role } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "admin",
    );

    const existing = await db.query.tasks.findMany({
      where: and(
        eq(tasks.workspaceId, parsedWorkspaceId.data),
        inArray(tasks.id, parsedIds.data),
      ),
      columns: { id: true, title: true, status: true },
    });

    // Each task still obeys the normal review workflow; tasks that cannot make
    // the jump are skipped instead of failing the whole batch.
    const transitionable = existing.filter((task) =>
      canTransition({
        role,
        isAssignee: false,
        from: task.status,
        to: parsedStatus.data,
      }),
    );

    if (transitionable.length === 0) {
      return {
        success: false,
        message: "No selected tasks can move to that status",
      };
    }

    await db
      .update(tasks)
      .set({ status: parsedStatus.data, updatedAt: new Date() })
      .where(
        and(
          eq(tasks.workspaceId, parsedWorkspaceId.data),
          inArray(
            tasks.id,
            transitionable.map((task) => task.id),
          ),
        ),
      );

    await Promise.all(
      transitionable.map((task) =>
        logActivity({
          workspaceId: parsedWorkspaceId.data,
          actorId: user.id,
          entityType: "task",
          entityId: task.id,
          action: "TASK_STATUS_CHANGE",
          metadata: {
            entityName: task.title,
            oldStatus: task.status,
            newStatus: parsedStatus.data,
          },
        }),
      ),
    );

    const skipped = existing.length - transitionable.length;
    return {
      success: true,
      message:
        skipped > 0
          ? `${transitionable.length} task(s) updated, ${skipped} skipped by the workflow`
          : `${transitionable.length} task(s) updated`,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update the selected tasks" };
  }
}

export async function bulkDeleteTasks(workspaceId: string, taskIds: string[]) {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedIds = taskIdListSchema.safeParse(taskIds);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedIds.success) {
      return { success: false, message: validationMessage(parsedIds.error) };
    }

    const { user } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "admin",
    );

    const existing = await db.query.tasks.findMany({
      where: and(
        eq(tasks.workspaceId, parsedWorkspaceId.data),
        inArray(tasks.id, parsedIds.data),
      ),
      columns: { id: true, title: true },
    });

    if (existing.length === 0) {
      return { success: false, message: "No matching tasks" };
    }

    await db
      .delete(tasks)
      .where(
        and(
          eq(tasks.workspaceId, parsedWorkspaceId.data),
          inArray(
            tasks.id,
            existing.map((task) => task.id),
          ),
        ),
      );

    await Promise.all(
      existing.map((task) =>
        logActivity({
          workspaceId: parsedWorkspaceId.data,
          actorId: user.id,
          entityType: "task",
          entityId: task.id,
          action: "TASK_DELETED",
          metadata: { entityName: task.title },
        }),
      ),
    );

    return {
      success: true,
      message: `${existing.length} task(s) deleted`,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not delete the selected tasks" };
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

  if (parsedStatus.data === "in_review") {
    const managerIds = await getWorkspaceManagerIds(
      parsedWorkspaceId.data,
      user.id,
    );

    await notifyUsers({
      userIds: managerIds,
      workspaceId: parsedWorkspaceId.data,
      type: "task_submitted",
      entityType: "task",
      entityId: parsedTaskId.data,
      title: "Task submitted for review",
      body: task.title,
      metadata: { taskId: parsedTaskId.data, taskTitle: task.title },
    });
  } else if (parsedStatus.data === "done" && task.assigneeId !== user.id) {
    await notifyUsers({
      userIds: [task.assigneeId],
      workspaceId: parsedWorkspaceId.data,
      type: "task_completed",
      entityType: "task",
      entityId: parsedTaskId.data,
      title: "Task completed",
      body: task.title,
      metadata: { taskId: parsedTaskId.data, taskTitle: task.title },
    });
  }

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
    action: "TASK_TITLE_UPDATED",
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
    action: "TASK_DESCRIPTION_UPDATED",
    metadata: { entityName: task.title },
  });
}

export async function requestChanges(
  taskId: string,
  workspaceId: string,
  note: string,
) {
  const parsedTaskId = idSchema.safeParse(taskId);
  const parsedWorkspaceId = idSchema.safeParse(workspaceId);
  const parsedNote = noteSchema.safeParse(note);

  if (!parsedTaskId.success) {
    return { success: false, message: validationMessage(parsedTaskId.error) };
  }
  if (!parsedWorkspaceId.success) {
    return {
      success: false,
      message: validationMessage(parsedWorkspaceId.error),
    };
  }
  if (!parsedNote.success) {
    return { success: false, message: validationMessage(parsedNote.error) };
  }

  const { user } = await requireWorkspaceAccess(
    parsedWorkspaceId.data,
    "admin",
  );
  const task = await getTaskInWorkspace(
    parsedTaskId.data,
    parsedWorkspaceId.data,
  );

  if (!task) return { success: false, message: "Task not found" };

  if (task.status !== "in_review") {
    return {
      success: false,
      message: "Only tasks in review can be sent back for changes",
    };
  }

  // Reset the status and store the note in one write so the task can never
  // end up back in todo without its feedback.
  const [updatedTask] = await db
    .update(tasks)
    .set({
      status: "todo",
      revisionNote: parsedNote.data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tasks.id, parsedTaskId.data),
        eq(tasks.workspaceId, parsedWorkspaceId.data),
      ),
    )
    .returning();

  if (!updatedTask) return { success: false, message: "Task not found" };

  await logActivity({
    workspaceId: parsedWorkspaceId.data,
    actorId: user.id,
    entityType: "task",
    entityId: parsedTaskId.data,
    action: "TASK_REVISION_REQUESTED",
    metadata: { entityName: task.title, note: parsedNote.data },
  });

  if (task.assigneeId !== user.id) {
    await notifyUsers({
      userIds: [task.assigneeId],
      workspaceId: parsedWorkspaceId.data,
      type: "changes_requested",
      entityType: "task",
      entityId: parsedTaskId.data,
      title: "Changes requested",
      body: task.title,
      metadata: { taskId: parsedTaskId.data, taskTitle: task.title },
    });
  }

  return { success: true, message: "Changes requested" };
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

  const { user: actor } = await requireWorkspaceAccess(
    parsedWorkspaceId.data,
    "admin",
  );

  const [task, assignee] = await Promise.all([
    getTaskInWorkspace(parsedTaskId.data, parsedWorkspaceId.data),
    db.query.user.findFirst({
      where: eq(user.id, parsedAssigneeId.data),
      columns: { name: true },
    }),
  ]);

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
    actorId: actor.id,
    entityType: "task",
    entityId: parsedTaskId.data,
    action: `TASK_ASSIGNED`,
    metadata: {
      entityName: task.title,
      assigneeId: parsedAssigneeId.data,
      assigneeName: assignee?.name ?? "a teammate",
    },
  });

  if (parsedAssigneeId.data !== actor.id) {
    await notifyUsers({
      userIds: [parsedAssigneeId.data],
      workspaceId: parsedWorkspaceId.data,
      type: "task_assigned",
      entityType: "task",
      entityId: parsedTaskId.data,
      title: "Task assigned to you",
      body: task.title,
      metadata: { taskId: parsedTaskId.data, taskTitle: task.title },
    });
  }
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
