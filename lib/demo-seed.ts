import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

import { db } from "@/db";
import {
  account,
  activityLogs,
  labels,
  notifications,
  subtasks,
  taskComments,
  taskLabels,
  tasks,
  user,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import {
  DEMO_EMAIL,
  DEMO_MEMBERS,
  DEMO_PASSWORD,
  DEMO_USER_NAME,
  DEMO_WORKSPACE_NAME,
} from "./demo";

const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

/**
 * Creates (or resets) the demo workspace. Idempotent so it can be called on
 * login to self-heal and from the Reset demo button.
 */
export async function seedDemoData(options?: { reset?: boolean }) {
  const [demoUser] = await db
    .insert(user)
    .values({
      id: randomUUID(),
      name: DEMO_USER_NAME,
      email: DEMO_EMAIL,
      emailVerified: true,
      emailNotifications: false,
      isDemo: true,
    })
    .onConflictDoUpdate({
      target: user.email,
      set: { name: DEMO_USER_NAME, emailVerified: true, isDemo: true },
    })
    .returning();

  // Replace the credential account so the demo login always uses the current
  // known password, even if someone changed it through the UI (they can't).
  await db
    .delete(account)
    .where(
      and(
        eq(account.userId, demoUser.id),
        eq(account.providerId, "credential"),
      ),
    );
  await db.insert(account).values({
    id: randomUUID(),
    accountId: demoUser.id,
    providerId: "credential",
    userId: demoUser.id,
    password: await hashPassword(DEMO_PASSWORD),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (options?.reset) {
    await db.delete(workspaces).where(eq(workspaces.isDemo, true));
  }

  let workspace = await db.query.workspaces.findFirst({
    where: and(
      eq(workspaces.isDemo, true),
      eq(workspaces.ownerId, demoUser.id),
    ),
  });
  if (!workspace) {
    [workspace] = await db
      .insert(workspaces)
      .values({
        id: randomUUID(),
        name: DEMO_WORKSPACE_NAME,
        ownerId: demoUser.id,
        isDemo: true,
      })
      .returning();
  }

  const workspaceId = workspace.id;

  // Clear seeded content so repeat calls produce the same showcase.
  await db.delete(activityLogs).where(eq(activityLogs.workspaceId, workspaceId));
  await db.delete(notifications).where(eq(notifications.workspaceId, workspaceId));
  await db.delete(labels).where(eq(labels.workspaceId, workspaceId));
  await db.delete(tasks).where(eq(tasks.workspaceId, workspaceId));
  await db
    .delete(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  const memberRows = [];
  for (const member of DEMO_MEMBERS) {
    const [row] = await db
      .insert(user)
      .values({
        id: randomUUID(),
        name: member.name,
        email: member.email,
        emailVerified: true,
        emailNotifications: false,
        isDemo: true,
      })
      .onConflictDoUpdate({
        target: user.email,
        set: { name: member.name, emailVerified: true, isDemo: true },
      })
      .returning();
    memberRows.push({
      workspaceId,
      userId: row.id,
      role: member.role,
    });
  }
  const [sam, priya] = memberRows;

  await db.insert(workspaceMembers).values([
    { workspaceId, userId: demoUser.id, role: "owner" },
    ...memberRows,
  ]);

  const taskSeeds = [
    {
      title: "Finalize Q4 launch checklist",
      description:
        "Confirm the release checklist with design and engineering, then send it for approval.",
      status: "in_review" as const,
      priority: "high" as const,
      assigneeId: demoUser.id,
      dueDate: inDays(3),
    },
    {
      title: "Review onboarding emails",
      description: "Tighten the copy in the welcome and invite emails.",
      status: "todo" as const,
      priority: "medium" as const,
      assigneeId: sam.userId,
      dueDate: inDays(5),
    },
    {
      title: "Update pricing page copy",
      description: "Reflect the new team plan wording.",
      status: "todo" as const,
      priority: "low" as const,
      assigneeId: priya.userId,
      dueDate: inDays(9),
    },
    {
      title: "Ship v2 activity feed",
      description: "Workspace-wide feed with load-more paging is live.",
      status: "done" as const,
      priority: "high" as const,
      assigneeId: demoUser.id,
      dueDate: inDays(-2),
    },
    {
      title: "Prepare weekly team update",
      description: "Summarize progress, blockers, and next steps.",
      status: "in_review" as const,
      priority: "medium" as const,
      assigneeId: sam.userId,
      dueDate: inDays(1),
    },
    {
      title: "Plan next sprint",
      description: "Repeats weekly so the demo shows recurring tasks.",
      status: "todo" as const,
      priority: "medium" as const,
      assigneeId: demoUser.id,
      dueDate: inDays(7),
      recurrence: "weekly" as const,
    },
  ];

  const createdTasks = [];
  for (const seed of taskSeeds) {
    const id = randomUUID();
    const [task] = await db
      .insert(tasks)
      .values({
        id,
        workspaceId,
        title: seed.title,
        description: seed.description,
        status: seed.status,
        priority: seed.priority,
        dueDate: seed.dueDate,
        assigneeId: seed.assigneeId,
        createdBy: demoUser.id,
        recurrence: seed.recurrence ?? "none",
        seriesId: seed.recurrence ? id : null,
      })
      .returning();
    createdTasks.push(task);

    await db.insert(activityLogs).values({
      workspaceId,
      actorId: demoUser.id,
      entityType: "task",
      entityId: task.id,
      action: "TASK_CREATE",
      metadata: { entityName: task.title },
    });
  }

  const [launch, onboarding, pricing] = createdTasks;

  const labelRows = await db
    .insert(labels)
    .values([
      { workspaceId, name: "design", color: "violet" },
      { workspaceId, name: "backend", color: "blue" },
      { workspaceId, name: "urgent", color: "red" },
    ])
    .returning();
  await db.insert(taskLabels).values([
    { taskId: launch.id, labelId: labelRows[2].id },
    { taskId: onboarding.id, labelId: labelRows[0].id },
    { taskId: pricing.id, labelId: labelRows[0].id },
  ]);

  await db.insert(taskComments).values([
    {
      taskId: launch.id,
      workspaceId,
      authorId: sam.userId,
      body: "Design assets are ready — I dropped them in the shared folder.",
    },
    {
      taskId: launch.id,
      workspaceId,
      authorId: demoUser.id,
      body: "Thanks! I'll fold them into the final checklist.",
    },
  ]);

  await db.insert(subtasks).values([
    {
      taskId: launch.id,
      workspaceId,
      authorId: demoUser.id,
      title: "Confirm release owner",
      completed: true,
      completedAt: new Date(),
    },
    {
      taskId: launch.id,
      workspaceId,
      authorId: demoUser.id,
      title: "Attach final screenshots",
    },
    {
      taskId: launch.id,
      workspaceId,
      authorId: demoUser.id,
      title: "Send for approval",
    },
  ]);

  await db.insert(activityLogs).values([
    {
      workspaceId,
      actorId: demoUser.id,
      entityType: "workspace",
      entityId: workspaceId,
      action: "WORKSPACE_CREATED",
      metadata: { entityName: workspace.name },
    },
    {
      workspaceId,
      actorId: demoUser.id,
      entityType: "task",
      entityId: launch.id,
      action: "TASK_COMMENT_ADDED",
      metadata: { entityName: launch.title },
    },
    {
      workspaceId,
      actorId: demoUser.id,
      entityType: "task",
      entityId: launch.id,
      action: "SUBTASK_ADDED",
      metadata: { entityName: "Confirm release owner" },
    },
  ]);

  await db.insert(notifications).values([
    {
      userId: demoUser.id,
      workspaceId,
      type: "task_submitted",
      entityType: "task",
      entityId: launch.id,
      title: "Task submitted for review",
      body: launch.title,
    },
    {
      userId: demoUser.id,
      workspaceId,
      type: "task_assigned",
      entityType: "task",
      entityId: onboarding.id,
      title: "New task assigned to you",
      body: onboarding.title,
      readAt: new Date(),
    },
  ]);

  return { workspaceId, userId: demoUser.id };
}
