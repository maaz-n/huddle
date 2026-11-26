import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { notifications, tasks, workspaceMembers } from "@/db/schema";
import {
  createTask,
  requestChanges,
  updateTaskStatus,
} from "@/actions/tasks";
import { addMember } from "@/actions/user";
import { updateUserRole } from "@/actions/workspace";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notifications";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Notifications", () => {
  let fixture: TestFixture;

  beforeEach(async () => {
    fixture = await createTwoUsersAndWorkspaces();
  });

  afterEach(async () => {
    clearSession();
    if (fixture) {
      await cleanupTestFixture(fixture);
    }
  });

  async function addUserBToWorkspace(role: "admin" | "member" = "member") {
    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role,
    });
  }

  async function notificationsFor(userId: string) {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async function findTask(title: string) {
    return db.query.tasks.findFirst({
      where: and(
        eq(tasks.workspaceId, fixture.workspaceA.id),
        eq(tasks.title, title),
      ),
    });
  }

  function dueDate() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  it("notifies an assignee when a task is created", async () => {
    await addUserBToWorkspace();
    actAs(fixture.userA);

    const result = await createTask(
      fixture.workspaceA.id,
      "Write docs",
      null,
      "todo",
      "medium",
      fixture.userB.id,
      dueDate(),
    );

    expect(result.success).toBe(true);

    const assigneeNotifications = await notificationsFor(fixture.userB.id);
    expect(assigneeNotifications).toHaveLength(1);
    expect(assigneeNotifications[0]).toMatchObject({
      type: "task_assigned",
      title: "New task assigned to you",
      body: "Write docs",
      workspaceId: fixture.workspaceA.id,
    });
    expect(await notificationsFor(fixture.userA.id)).toHaveLength(0);
  });

  it("does not notify the actor about their own action", async () => {
    actAs(fixture.userA);

    const result = await createTask(
      fixture.workspaceA.id,
      "Own task",
      null,
      "todo",
      "low",
      fixture.userA.id,
      dueDate(),
    );

    expect(result.success).toBe(true);
    expect(await notificationsFor(fixture.userA.id)).toHaveLength(0);
  });

  it("notifies managers when an assignee submits work for review", async () => {
    await addUserBToWorkspace();
    actAs(fixture.userA);
    await createTask(
      fixture.workspaceA.id,
      "Review me",
      null,
      "todo",
      "medium",
      fixture.userB.id,
      dueDate(),
    );
    const task = await findTask("Review me");

    actAs(fixture.userB);
    const updated = await updateTaskStatus(
      task!.id,
      fixture.workspaceA.id,
      "in_review",
    );
    expect(updated.success).toBe(true);

    const managerNotifications = (await notificationsFor(fixture.userA.id)).filter(
      (notification) => notification.type === "task_submitted",
    );
    expect(managerNotifications).toHaveLength(1);
    expect(managerNotifications[0].body).toBe("Review me");

    const actorNotifications = (await notificationsFor(fixture.userB.id)).filter(
      (notification) => notification.type === "task_submitted",
    );
    expect(actorNotifications).toHaveLength(0);
  });

  it("notifies the assignee when a manager approves a task", async () => {
    await addUserBToWorkspace();
    actAs(fixture.userA);
    await createTask(
      fixture.workspaceA.id,
      "Ship it",
      null,
      "todo",
      "high",
      fixture.userB.id,
      dueDate(),
    );
    const task = await findTask("Ship it");

    actAs(fixture.userB);
    await updateTaskStatus(task!.id, fixture.workspaceA.id, "in_review");

    actAs(fixture.userA);
    const updated = await updateTaskStatus(
      task!.id,
      fixture.workspaceA.id,
      "done",
    );
    expect(updated.success).toBe(true);

    const completed = (await notificationsFor(fixture.userB.id)).filter(
      (notification) => notification.type === "task_completed",
    );
    expect(completed).toHaveLength(1);
    expect(completed[0].body).toBe("Ship it");
  });

  it("notifies the assignee when changes are requested", async () => {
    await addUserBToWorkspace();
    actAs(fixture.userA);
    await createTask(
      fixture.workspaceA.id,
      "Needs work",
      null,
      "todo",
      "medium",
      fixture.userB.id,
      dueDate(),
    );
    const task = await findTask("Needs work");

    actAs(fixture.userB);
    await updateTaskStatus(task!.id, fixture.workspaceA.id, "in_review");

    actAs(fixture.userA);
    const result = await requestChanges(
      task!.id,
      fixture.workspaceA.id,
      "Add tests",
    );
    expect(result.success).toBe(true);

    const changes = (await notificationsFor(fixture.userB.id)).filter(
      (notification) => notification.type === "changes_requested",
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].body).toBe("Needs work");
  });

  it("only lets a user read and mark their own notifications", async () => {
    await addUserBToWorkspace();
    actAs(fixture.userA);
    await createTask(
      fixture.workspaceA.id,
      "Private task",
      null,
      "todo",
      "medium",
      fixture.userB.id,
      dueDate(),
    );
    const [notification] = await notificationsFor(fixture.userB.id);

    actAs(fixture.userB);
    expect(await getUnreadNotificationCount()).toBe(1);
    const items = await getNotifications();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(notification.id);

    actAs(fixture.userA);
    const denied = await markNotificationRead(notification.id);
    expect(denied.success).toBe(false);
    const [stillUnread] = await notificationsFor(fixture.userB.id);
    expect(stillUnread.readAt).toBeNull();

    actAs(fixture.userB);
    const marked = await markNotificationRead(notification.id);
    expect(marked.success).toBe(true);
    expect(await getUnreadNotificationCount()).toBe(0);
  });

  it("marks all notifications as read", async () => {
    await addUserBToWorkspace();
    actAs(fixture.userA);
    await createTask(
      fixture.workspaceA.id,
      "First task",
      null,
      "todo",
      "low",
      fixture.userB.id,
      dueDate(),
    );
    await createTask(
      fixture.workspaceA.id,
      "Second task",
      null,
      "todo",
      "low",
      fixture.userB.id,
      dueDate(),
    );

    actAs(fixture.userB);
    expect(await getUnreadNotificationCount()).toBe(2);

    const result = await markAllNotificationsRead();
    expect(result.success).toBe(true);
    expect(await getUnreadNotificationCount()).toBe(0);
  });

  it("notifies a user when they are added to a workspace", async () => {
    actAs(fixture.userA);

    const result = await addMember(
      fixture.workspaceA.id,
      "member",
      fixture.userB.email,
    );
    expect(result.success).toBe(true);

    const added = (await notificationsFor(fixture.userB.id)).filter(
      (notification) => notification.type === "workspace_added",
    );
    expect(added).toHaveLength(1);
    expect(added[0].body).toBe("Workspace A");
  });

  it("notifies a member when their role changes", async () => {
    await addUserBToWorkspace();
    actAs(fixture.userA);

    const result = await updateUserRole(
      fixture.workspaceA.id,
      fixture.userB.id,
      "admin",
    );
    expect(result.success).toBe(true);

    const roleChanged = (await notificationsFor(fixture.userB.id)).filter(
      (notification) => notification.type === "role_changed",
    );
    expect(roleChanged).toHaveLength(1);
    expect(roleChanged[0].body).toContain("admin");
  });
});
