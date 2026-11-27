import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, taskLabels, workspaceMembers } from "@/db/schema";
import {
  createLabel,
  deleteLabel,
  getTaskLabels,
  getWorkspaceLabels,
  setTaskLabels,
} from "@/actions/labels";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Task labels", () => {
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

  it("creates a label for the workspace", async () => {
    actAs(fixture.userA);

    const result = await createLabel(fixture.workspaceA.id, "Bug", "red");
    expect(result.success).toBe(true);

    const labels = await getWorkspaceLabels(fixture.workspaceA.id);
    expect(labels).toHaveLength(1);
    expect(labels[0].name).toBe("Bug");
    expect(labels[0].color).toBe("red");
  });

  it("returns the existing label instead of creating a duplicate", async () => {
    actAs(fixture.userA);

    const first = await createLabel(fixture.workspaceA.id, "Bug", "red");
    const second = await createLabel(fixture.workspaceA.id, "Bug", "blue");

    expect(second.success).toBe(true);
    expect(second.label?.id).toBe(first.label?.id);

    const labels = await getWorkspaceLabels(fixture.workspaceA.id);
    expect(labels).toHaveLength(1);
    expect(labels[0].color).toBe("red");
  });

  it("attaches and detaches labels on a task", async () => {
    actAs(fixture.userA);
    const created = await createLabel(fixture.workspaceA.id, "Bug", "red");
    const labelId = created.label!.id;

    const attached = await setTaskLabels(fixture.taskA.id, fixture.workspaceA.id, [
      labelId,
    ]);
    expect(attached.success).toBe(true);

    const labels = await getTaskLabels(fixture.taskA.id, fixture.workspaceA.id);
    expect(labels.map((label) => label.name)).toEqual(["Bug"]);

    const cleared = await setTaskLabels(
      fixture.taskA.id,
      fixture.workspaceA.id,
      [],
    );
    expect(cleared.success).toBe(true);

    const after = await getTaskLabels(fixture.taskA.id, fixture.workspaceA.id);
    expect(after).toHaveLength(0);

    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.entityId, fixture.taskA.id));
    expect(logs.map((log) => log.action)).toContain("TASK_LABELS_UPDATED");
  });

  it("ignores labels from another workspace", async () => {
    actAs(fixture.userB);
    const foreign = await createLabel(fixture.workspaceB.id, "Foreign", "blue");
    expect(foreign.success).toBe(true);

    actAs(fixture.userA);
    const result = await setTaskLabels(
      fixture.taskA.id,
      fixture.workspaceA.id,
      [foreign.label!.id],
    );

    expect(result.success).toBe(true);
    expect(result.labelIds).toEqual([]);

    const links = await db
      .select()
      .from(taskLabels)
      .where(eq(taskLabels.taskId, fixture.taskA.id));
    expect(links).toHaveLength(0);
  });

  it("deletes a label and its task links", async () => {
    actAs(fixture.userA);
    const created = await createLabel(fixture.workspaceA.id, "Bug", "red");
    await setTaskLabels(fixture.taskA.id, fixture.workspaceA.id, [
      created.label!.id,
    ]);

    const result = await deleteLabel(
      fixture.workspaceA.id,
      created.label!.id,
    );
    expect(result.success).toBe(true);

    const labels = await getWorkspaceLabels(fixture.workspaceA.id);
    expect(labels).toHaveLength(0);

    const links = await db
      .select()
      .from(taskLabels)
      .where(eq(taskLabels.taskId, fixture.taskA.id));
    expect(links).toHaveLength(0);
  });

  it("rejects non-admin members", async () => {
    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "member",
    });
    actAs(fixture.userB);

    const result = await createLabel(fixture.workspaceA.id, "Bug", "red");
    expect(result.success).toBe(false);

    const labels = await getWorkspaceLabels(fixture.workspaceA.id);
    expect(labels).toHaveLength(0);
  });

  it("rejects an invalid color", async () => {
    actAs(fixture.userA);

    const result = await createLabel(
      fixture.workspaceA.id,
      "Bug",
      "rainbow" as never,
    );
    expect(result.success).toBe(false);
  });
});
