import { randomUUID } from "crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, tasks } from "@/db/schema";
import {
  bulkUpdateTaskStatus,
  createTask,
  updateTaskStatus,
} from "@/actions/tasks";
import { getNextDueDate } from "@/lib/recurrence";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("getNextDueDate", () => {
  const now = new Date("2026-01-15T12:00:00.000Z");

  it("returns null for a non-repeating task", () => {
    expect(getNextDueDate("2026-01-15T08:00:00.000Z", "none", now)).toBeNull();
  });

  it("advances by the selected interval", () => {
    expect(getNextDueDate("2026-01-15T08:00:00.000Z", "daily", now)).toBe(
      "2026-01-16T08:00:00.000Z",
    );
    expect(getNextDueDate("2026-01-15T08:00:00.000Z", "weekly", now)).toBe(
      "2026-01-22T08:00:00.000Z",
    );
    expect(getNextDueDate("2026-01-15T08:00:00.000Z", "monthly", now)).toBe(
      "2026-02-15T08:00:00.000Z",
    );
  });

  it("skips occurrences that are already in the past", () => {
    expect(getNextDueDate("2026-01-01T08:00:00.000Z", "daily", now)).toBe(
      "2026-01-16T08:00:00.000Z",
    );
  });

  it("clamps a month-end date to the last day of shorter months", () => {
    expect(getNextDueDate("2026-01-31T08:00:00.000Z", "monthly", now)).toBe(
      "2026-02-28T08:00:00.000Z",
    );
  });

  it("returns null for an invalid due date", () => {
    expect(getNextDueDate("not a date", "weekly", now)).toBeNull();
  });
});

describe("Recurring tasks", () => {
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

  async function insertRecurring(
    title: string,
    recurrence: "daily" | "weekly" | "monthly" = "weekly",
    status: "todo" | "in_review" = "in_review",
    dueDate = new Date(Date.now() - 3 * 86400000).toISOString(),
  ) {
    const seriesId = randomUUID();
    const [task] = await db
      .insert(tasks)
      .values({
        id: seriesId,
        workspaceId: fixture.workspaceA.id,
        title,
        description: "Recurring details",
        status,
        priority: "medium",
        dueDate,
        assigneeId: fixture.userA.id,
        createdBy: fixture.userA.id,
        recurrence,
        seriesId,
      })
      .returning();
    return task;
  }

  it("stores a recurrence and a stable series id on creation", async () => {
    actAs(fixture.userA);

    const result = await createTask(
      fixture.workspaceA.id,
      "Weekly report",
      null,
      "in_review",
      "medium",
      fixture.userA.id,
      new Date(Date.now() + 86400000).toISOString(),
      "weekly",
    );
    expect(result.success).toBe(true);

    const created = await db.query.tasks.findFirst({
      where: eq(tasks.title, "Weekly report"),
    });
    expect(created?.recurrence).toBe("weekly");
    expect(created?.seriesId).toBe(created?.id);
  });

  it("rejects an unsupported recurrence", async () => {
    actAs(fixture.userA);

    const result = await createTask(
      fixture.workspaceA.id,
      "Yearly report",
      null,
      "todo",
      "medium",
      fixture.userA.id,
      new Date(Date.now() + 86400000).toISOString(),
      "yearly" as never,
    );
    expect(result.success).toBe(false);
  });

  it("schedules the next occurrence when a task is completed", async () => {
    const parent = await insertRecurring("Weekly report");
    actAs(fixture.userA);

    const result = await updateTaskStatus(
      parent.id,
      fixture.workspaceA.id,
      "done",
    );
    expect(result.success).toBe(true);

    const series = await db
      .select()
      .from(tasks)
      .where(eq(tasks.seriesId, parent.seriesId!))
      .orderBy(asc(tasks.dueDate));
    expect(series).toHaveLength(2);

    const next = series[1];
    expect(next.id).not.toBe(parent.id);
    expect(next.title).toBe("Weekly report");
    expect(next.description).toBe("Recurring details");
    expect(next.status).toBe("todo");
    expect(next.recurrence).toBe("weekly");
    expect(next.seriesId).toBe(parent.seriesId);
    expect(Date.parse(next.dueDate)).toBeGreaterThan(Date.now());

    const [log] = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.action, "TASK_RECURRENCE_CREATED"));
    expect(log.entityId).toBe(parent.id);
    expect(log.metadata?.entityName).toBe("Weekly report");
  });

  it("does not duplicate an occurrence that is already pending", async () => {
    const parent = await insertRecurring("Weekly report");
    await db.insert(tasks).values({
      workspaceId: fixture.workspaceA.id,
      title: "Weekly report",
      status: "todo",
      priority: "medium",
      dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
      assigneeId: fixture.userA.id,
      createdBy: fixture.userA.id,
      recurrence: "weekly",
      seriesId: parent.seriesId,
    });
    actAs(fixture.userA);

    const result = await updateTaskStatus(
      parent.id,
      fixture.workspaceA.id,
      "done",
    );

    expect(result.success).toBe(true);
    const series = await db
      .select()
      .from(tasks)
      .where(eq(tasks.seriesId, parent.seriesId!));
    expect(series).toHaveLength(2);
  });

  it("leaves non-recurring tasks alone", async () => {
    await db
      .update(tasks)
      .set({ status: "in_review" })
      .where(eq(tasks.id, fixture.taskA.id));
    actAs(fixture.userA);

    const result = await updateTaskStatus(
      fixture.taskA.id,
      fixture.workspaceA.id,
      "done",
    );
    expect(result.success).toBe(true);

    const all = await db
      .select()
      .from(tasks)
      .where(eq(tasks.workspaceId, fixture.workspaceA.id));
    expect(all).toHaveLength(1);
  });

  it("schedules an occurrence for each recurring task in a bulk update", async () => {
    const first = await insertRecurring("Daily standup", "daily");
    const second = await insertRecurring("Weekly review", "weekly");
    actAs(fixture.userA);

    const result = await bulkUpdateTaskStatus(fixture.workspaceA.id, [
      first.id,
      second.id,
    ], "done");

    expect(result.success).toBe(true);

    const upcoming = await db
      .select()
      .from(tasks)
      .where(eq(tasks.workspaceId, fixture.workspaceA.id));
    // Includes the fixture's original task plus both series and their
    // generated occurrences.
    expect(upcoming).toHaveLength(5);
    expect(upcoming.filter((task) => task.seriesId === first.seriesId)).toHaveLength(2);
    expect(upcoming.filter((task) => task.seriesId === second.seriesId)).toHaveLength(2);
  });
});
