import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { notifications, taskComments, workspaceMembers } from "@/db/schema";
import {
  addTaskComment,
  deleteTaskComment,
  getTaskComments,
} from "@/actions/comments";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Task comments", () => {
  let fixture: TestFixture;

  beforeEach(async () => {
    fixture = await createTwoUsersAndWorkspaces();
    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "member",
    });
  });

  afterEach(async () => {
    clearSession();
    if (fixture) {
      await cleanupTestFixture(fixture);
    }
  });

  it("adds a comment with the author attached", async () => {
    actAs(fixture.userB);

    const result = await addTaskComment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Looks good to me",
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.comment.body).toBe("Looks good to me");
    expect(result.comment.author.id).toBe(fixture.userB.id);
    expect(result.comment.author.name).toBe(fixture.userB.name);

    const stored = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, fixture.taskA.id));
    expect(stored).toHaveLength(1);
  });

  it("rejects an empty comment", async () => {
    actAs(fixture.userB);

    const result = await addTaskComment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "   ",
    );

    expect(result.success).toBe(false);
    const stored = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, fixture.taskA.id));
    expect(stored).toHaveLength(0);
  });

  it("rejects a user who is not in the workspace", async () => {
    // User A belongs to workspace A only, so workspace B is off limits.
    actAs(fixture.userA);

    const result = await addTaskComment(
      fixture.taskB.id,
      fixture.workspaceB.id,
      "Sneaking in",
    );

    expect(result.success).toBe(false);
  });

  it("returns comments oldest first", async () => {
    actAs(fixture.userB);
    await addTaskComment(fixture.taskA.id, fixture.workspaceA.id, "First");
    await addTaskComment(fixture.taskA.id, fixture.workspaceA.id, "Second");

    const comments = await getTaskComments(
      fixture.taskA.id,
      fixture.workspaceA.id,
    );

    expect(comments.map((comment) => comment.body)).toEqual([
      "First",
      "Second",
    ]);
  });

  it("notifies the assignee and creator but not the commenter", async () => {
    actAs(fixture.userB);

    await addTaskComment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Can you take a look?",
    );

    const rows = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.entityId, fixture.taskA.id),
          eq(notifications.type, "task_comment"),
        ),
      );

    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(fixture.userA.id);
  });

  it("lets a member delete their own comment", async () => {
    actAs(fixture.userB);
    const comment = await addTaskComment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Mine",
    );
    expect(comment.success).toBe(true);
    if (!comment.success) return;

    const result = await deleteTaskComment(
      comment.comment.id,
      fixture.workspaceA.id,
    );

    expect(result.success).toBe(true);
    const stored = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, comment.comment.id));
    expect(stored).toHaveLength(0);
  });

  it("lets a manager delete anyone's comment", async () => {
    actAs(fixture.userB);
    const comment = await addTaskComment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "From a member",
    );
    expect(comment.success).toBe(true);
    if (!comment.success) return;

    // User A owns the workspace, so they may delete any comment.
    actAs(fixture.userA);
    const result = await deleteTaskComment(
      comment.comment.id,
      fixture.workspaceA.id,
    );

    expect(result.success).toBe(true);
  });

  it("does not let a member delete another member's comment", async () => {
    actAs(fixture.userA);
    const comment = await addTaskComment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "From the owner",
    );
    expect(comment.success).toBe(true);
    if (!comment.success) return;

    actAs(fixture.userB);
    const result = await deleteTaskComment(
      comment.comment.id,
      fixture.workspaceA.id,
    );

    expect(result.success).toBe(false);
    const stored = await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, comment.comment.id));
    expect(stored).toHaveLength(1);
  });
});
