import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, tasks, workspaceMembers } from "@/db/schema";
import { getTaskActivity } from "@/actions/activity";
import { addTaskComment } from "@/actions/comments";
import { updateTaskStatus } from "@/actions/tasks";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Task activity", () => {
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

  it("returns task events newest first with the actor attached", async () => {
    actAs(fixture.userA);
    await addTaskComment(fixture.taskA.id, fixture.workspaceA.id, "First note");
    await updateTaskStatus(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "in_review",
    );

    const activity = await getTaskActivity(
      fixture.taskA.id,
      fixture.workspaceA.id,
    );

    expect(activity.map((item) => item.action)).toEqual([
      "TASK_STATUS_CHANGE",
      "TASK_COMMENT_ADDED",
    ]);
    expect(activity[0].actor.name).toBe(fixture.userA.name);
    expect(activity[0].metadata?.newStatus).toBe("in_review");
  });

  it("only returns logs for the requested task", async () => {
    const [otherTask] = await db
      .insert(tasks)
      .values({
        workspaceId: fixture.workspaceA.id,
        title: "Another task",
        status: "todo",
        priority: "low",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assigneeId: fixture.userA.id,
        createdBy: fixture.userA.id,
      })
      .returning();

    actAs(fixture.userA);
    await addTaskComment(fixture.taskA.id, fixture.workspaceA.id, "On task A");
    await addTaskComment(otherTask.id, fixture.workspaceA.id, "On the other");

    const activity = await getTaskActivity(
      fixture.taskA.id,
      fixture.workspaceA.id,
    );

    expect(activity).toHaveLength(1);
    expect(activity[0].metadata?.comment).toBe("On task A");
  });

  it("returns an empty list for a task in another workspace", async () => {
    actAs(fixture.userB);

    const activity = await getTaskActivity(
      fixture.taskA.id,
      fixture.workspaceB.id,
    );

    expect(activity).toEqual([]);
  });

  it("returns an empty list without workspace membership", async () => {
    actAs(fixture.userA);

    const activity = await getTaskActivity(
      fixture.taskB.id,
      fixture.workspaceB.id,
    );

    expect(activity).toEqual([]);
  });

  it("keeps comments in the activity stream", async () => {
    actAs(fixture.userB);
    await addTaskComment(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "Visible in timeline",
    );

    const [log] = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.entityId, fixture.taskA.id))
      .orderBy(asc(activityLogs.createdAt));

    expect(log.action).toBe("TASK_COMMENT_ADDED");
    expect(log.metadata?.comment).toBe("Visible in timeline");
  });
});
