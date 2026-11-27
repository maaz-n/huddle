import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, subtasks, workspaceMembers } from "@/db/schema";
import {
  createSubtask,
  deleteSubtask,
  getSubtasks,
  toggleSubtask,
} from "@/actions/subtasks";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Subtasks", () => {
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

  it("creates and lists subtasks on a task", async () => {
    actAs(fixture.userA);

    const result = await createSubtask(fixture.taskA.id, fixture.workspaceA.id, "Write tests");
    expect(result.success).toBe(true);

    const list = await getSubtasks(fixture.taskA.id, fixture.workspaceA.id);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Write tests");
    expect(list[0].completed).toBe(false);
    expect(list[0].authorId).toBe(fixture.userA.id);

    const [log] = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.action, "SUBTASK_ADDED"));
    expect(log.entityId).toBe(fixture.taskA.id);
  });

  it("marks a subtask complete and reopens it", async () => {
    actAs(fixture.userA);
    const created = await createSubtask(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Draft",
    );

    expect(
      (await toggleSubtask(created.subtask!.id, fixture.workspaceA.id, true))
        .success,
    ).toBe(true);

    let [stored] = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.id, created.subtask!.id));
    expect(stored.completed).toBe(true);
    expect(stored.completedAt).not.toBeNull();

    expect(
      (await toggleSubtask(created.subtask!.id, fixture.workspaceA.id, false))
        .success,
    ).toBe(true);

    [stored] = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.id, created.subtask!.id));
    expect(stored.completed).toBe(false);
    expect(stored.completedAt).toBeNull();

    const logs = await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.entityId, fixture.taskA.id),
          eq(activityLogs.action, "SUBTASK_REOPENED"),
        ),
      );
    expect(logs).toHaveLength(1);
  });

  it("does not log a no-op toggle", async () => {
    actAs(fixture.userA);
    const created = await createSubtask(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Draft",
    );

    await toggleSubtask(created.subtask!.id, fixture.workspaceA.id, false);

    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.action, "SUBTASK_COMPLETED"));
    expect(logs).toHaveLength(0);
  });

  it("lets the author delete a subtask", async () => {
    actAs(fixture.userA);
    const created = await createSubtask(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Draft",
    );

    const result = await deleteSubtask(
      created.subtask!.id,
      fixture.workspaceA.id,
    );
    expect(result.success).toBe(true);
    expect(await getSubtasks(fixture.taskA.id, fixture.workspaceA.id)).toEqual(
      [],
    );
  });

  it("stops non-authors from deleting", async () => {
    actAs(fixture.userA);
    const created = await createSubtask(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Draft",
    );

    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "member",
    });
    actAs(fixture.userB);

    const result = await deleteSubtask(
      created.subtask!.id,
      fixture.workspaceA.id,
    );
    expect(result.success).toBe(false);
  });

  it("lets admins delete any subtask", async () => {
    actAs(fixture.userA);
    const created = await createSubtask(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Draft",
    );

    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "admin",
    });
    actAs(fixture.userB);

    const result = await deleteSubtask(
      created.subtask!.id,
      fixture.workspaceA.id,
    );
    expect(result.success).toBe(true);
  });

  it("enforces the per-task limit", async () => {
    actAs(fixture.userA);

    await db.insert(subtasks).values(
      Array.from({ length: 20 }, (_, index) => ({
        taskId: fixture.taskA.id,
        workspaceId: fixture.workspaceA.id,
        authorId: fixture.userA.id,
        title: `Step ${index}`,
      })),
    );

    const result = await createSubtask(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "One too many",
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("at most");
  });

  it("rejects a task from a different workspace", async () => {
    actAs(fixture.userA);

    const result = await createSubtask(
      fixture.taskB.id,
      fixture.workspaceA.id,
      "Cross workspace",
    );
    expect(result.success).toBe(false);

    const stored = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.workspaceId, fixture.workspaceA.id));
    expect(stored).toHaveLength(0);
  });

  it("rejects non-members", async () => {
    actAs(fixture.userB);

    const result = await createSubtask(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Outsider",
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", async () => {
    actAs(fixture.userA);

    const result = await createSubtask(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "   ",
    );
    expect(result.success).toBe(false);
  });
});
