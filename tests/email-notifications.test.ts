import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { notifications, user, workspaceMembers } from "@/db/schema";
import { createTask, requestChanges, updateTaskStatus } from "@/actions/tasks";
import { updateEmailNotifications } from "@/actions/user";
import { sendEmail } from "@/lib/email";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

const sendEmailMock = vi.mocked(sendEmail);
const originalResendKey = process.env.RESEND_API_KEY;

describe("Email notifications", () => {
  let fixture: TestFixture;

  beforeEach(async () => {
    fixture = await createTwoUsersAndWorkspaces();
    process.env.RESEND_API_KEY = "test-key";
    sendEmailMock.mockClear();

    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "member",
    });
  });

  afterEach(async () => {
    if (originalResendKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalResendKey;
    }
    clearSession();
    if (fixture) {
      await cleanupTestFixture(fixture);
    }
  });

  function dueDate() {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  async function createAssignedTask(title: string) {
    actAs(fixture.userA);
    return createTask(
      fixture.workspaceA.id,
      title,
      null,
      "todo",
      "medium",
      fixture.userB.id,
      dueDate(),
    );
  }

  it("emails an assignee when a task is created", async () => {
    const result = await createAssignedTask("Email me");
    expect(result.success).toBe(true);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const message = sendEmailMock.mock.calls[0][0];
    expect(message.to).toBe(fixture.userB.email);
    expect(message.subject).toContain("New task assigned to you");
    expect(message.html).toContain("Email me");
    expect(message.html).toContain("Workspace A");
  });

  it("does not email the actor about their own action", async () => {
    actAs(fixture.userA);
    await createTask(
      fixture.workspaceA.id,
      "Own task",
      null,
      "todo",
      "low",
      fixture.userA.id,
      dueDate(),
    );

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("respects a recipient who turned email notifications off", async () => {
    actAs(fixture.userB);
    const updated = await updateEmailNotifications(false);
    expect(updated.success).toBe(true);

    await createAssignedTask("Quiet task");

    expect(sendEmailMock).not.toHaveBeenCalled();

    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, fixture.userB.id));
    expect(notification).toBeDefined();
    expect(notification.type).toBe("task_assigned");
  });

  it("emails the assignee when changes are requested", async () => {
    await createAssignedTask("Needs work");
    const task = await db.query.tasks.findFirst({
      where: (tasks, { eq }) => eq(tasks.title, "Needs work"),
    });
    sendEmailMock.mockClear();

    actAs(fixture.userB);
    await updateTaskStatus(task!.id, fixture.workspaceA.id, "in_review");

    actAs(fixture.userA);
    const result = await requestChanges(
      task!.id,
      fixture.workspaceA.id,
      "Add tests",
    );
    expect(result.success).toBe(true);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const message = sendEmailMock.mock.calls[0][0];
    expect(message.to).toBe(fixture.userB.email);
    expect(message.subject).toContain("Changes requested");
    expect(message.html).toContain("Needs work");
  });

  it("enables email notifications by default", async () => {
    const stored = await db.query.user.findFirst({
      where: eq(user.id, fixture.userB.id),
      columns: { emailNotifications: true },
    });

    expect(stored?.emailNotifications).toBe(true);
  });
});
