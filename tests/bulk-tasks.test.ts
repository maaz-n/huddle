import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, tasks, workspaceMembers } from "@/db/schema";
import { bulkDeleteTasks, bulkUpdateTaskStatus } from "@/actions/tasks";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Bulk task actions", () => {
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

  async function createTask(
    title: string,
    status: "todo" | "in_review" | "done" = "todo",
  ) {
    const [task] = await db
      .insert(tasks)
      .values({
        workspaceId: fixture.workspaceA.id,
        title,
        status,
        priority: "medium",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assigneeId: fixture.userA.id,
        createdBy: fixture.userA.id,
      })
      .returning();
    return task;
  }

  it("moves eligible tasks and skips workflow violations", async () => {
    const reviewable = await createTask("Ready for approval", "in_review");
    const fresh = await createTask("Still todo", "todo");
    actAs(fixture.userA);

    const result = await bulkUpdateTaskStatus(
      fixture.workspaceA.id,
      [reviewable.id, fresh.id],
      "done",
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain("1 task(s) updated");
    expect(result.message).toContain("1 skipped");

    const updated = await db.query.tasks.findFirst({
      where: eq(tasks.id, reviewable.id),
    });
    const untouched = await db.query.tasks.findFirst({
      where: eq(tasks.id, fresh.id),
    });
    expect(updated?.status).toBe("done");
    expect(untouched?.status).toBe("todo");

    const [log] = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.entityId, reviewable.id));
    expect(log.action).toBe("TASK_STATUS_CHANGE");
    expect(log.metadata?.newStatus).toBe("done");
  });

  it("refuses a batch where no task can make the transition", async () => {
    const fresh = await createTask("Still todo", "todo");
    actAs(fixture.userA);

    const result = await bulkUpdateTaskStatus(
      fixture.workspaceA.id,
      [fresh.id],
      "done",
    );

    expect(result.success).toBe(false);
    const stored = await db.query.tasks.findFirst({
      where: eq(tasks.id, fresh.id),
    });
    expect(stored?.status).toBe("todo");
  });

  it("deletes the selected tasks and records each deletion", async () => {
    const first = await createTask("Bulk delete one");
    const second = await createTask("Bulk delete two");
    actAs(fixture.userA);

    const result = await bulkDeleteTasks(fixture.workspaceA.id, [
      first.id,
      second.id,
    ]);

    expect(result.success).toBe(true);
    expect(result.message).toContain("2 task(s) deleted");

    const remaining = await db
      .select()
      .from(tasks)
      .where(eq(tasks.workspaceId, fixture.workspaceA.id));
    expect(remaining.map((task) => task.id)).not.toContain(first.id);
    expect(remaining.map((task) => task.id)).not.toContain(second.id);

    const logs = await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.action, "TASK_DELETED"),
          eq(activityLogs.workspaceId, fixture.workspaceA.id),
        ),
      );
    expect(logs.map((log) => log.metadata?.entityName).sort()).toEqual([
      "Bulk delete one",
      "Bulk delete two",
    ]);
  });

  it("ignores ids that belong to another workspace", async () => {
    actAs(fixture.userA);

    const result = await bulkDeleteTasks(fixture.workspaceA.id, [
      fixture.taskB.id,
    ]);

    expect(result.success).toBe(false);
    const stored = await db.query.tasks.findFirst({
      where: eq(tasks.id, fixture.taskB.id),
    });
    expect(stored).toBeDefined();
  });

  it("requires an admin role", async () => {
    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "member",
    });
    actAs(fixture.userB);

    const result = await bulkDeleteTasks(fixture.workspaceA.id, [
      fixture.taskA.id,
    ]);

    expect(result.success).toBe(false);
    const stored = await db.query.tasks.findFirst({
      where: eq(tasks.id, fixture.taskA.id),
    });
    expect(stored).toBeDefined();
  });

  it("rejects an empty selection", async () => {
    actAs(fixture.userA);

    const result = await bulkUpdateTaskStatus(fixture.workspaceA.id, [], "done");

    expect(result.success).toBe(false);
  });
});
