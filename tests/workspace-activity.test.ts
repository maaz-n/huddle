import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getWorkspaceActivity } from "@/actions/activity";
import { addTaskComment } from "@/actions/comments";
import { updateTaskStatus } from "@/actions/tasks";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Workspace activity", () => {
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

  it("returns activity across every task in the workspace", async () => {
    const [secondTask] = await db
      .insert(tasks)
      .values({
        workspaceId: fixture.workspaceA.id,
        title: "Second task",
        status: "todo",
        priority: "high",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assigneeId: fixture.userA.id,
        createdBy: fixture.userA.id,
      })
      .returning();

    actAs(fixture.userA);
    await addTaskComment(fixture.taskA.id, fixture.workspaceA.id, "One");
    await updateTaskStatus(fixture.taskA.id, fixture.workspaceA.id, "in_review");
    await addTaskComment(secondTask.id, fixture.workspaceA.id, "Two");

    const activity = await getWorkspaceActivity(fixture.workspaceA.id);

    expect(activity).toHaveLength(3);
    expect(activity.map((item) => item.action)).toContain("TASK_COMMENT_ADDED");
    expect(activity.map((item) => item.action)).toContain("TASK_STATUS_CHANGE");
    expect(activity[0].actor.name).toBe(fixture.userA.name);
  });

  it("does not include another workspace's activity", async () => {
    actAs(fixture.userA);
    await addTaskComment(fixture.taskA.id, fixture.workspaceA.id, "Workspace A");
    actAs(fixture.userB);
    await addTaskComment(fixture.taskB.id, fixture.workspaceB.id, "Workspace B");

    actAs(fixture.userA);
    const activity = await getWorkspaceActivity(fixture.workspaceA.id);

    expect(activity).toHaveLength(1);
    expect(activity[0].metadata?.comment).toBe("Workspace A");
  });

  it("paginates with limit and offset", async () => {
    actAs(fixture.userA);
    await addTaskComment(fixture.taskA.id, fixture.workspaceA.id, "One");
    await updateTaskStatus(fixture.taskA.id, fixture.workspaceA.id, "in_review");

    const firstPage = await getWorkspaceActivity(fixture.workspaceA.id, 1, 0);
    const secondPage = await getWorkspaceActivity(fixture.workspaceA.id, 1, 1);

    expect(firstPage).toHaveLength(1);
    expect(secondPage).toHaveLength(1);
    expect(firstPage[0].id).not.toBe(secondPage[0].id);
  });

  it("returns an empty list without workspace access", async () => {
    actAs(fixture.userA);

    const activity = await getWorkspaceActivity(fixture.workspaceB.id);

    expect(activity).toEqual([]);
  });
});
