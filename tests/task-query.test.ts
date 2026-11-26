import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { getTaskCount, getTasks } from "@/actions/tasks";
import type { GetFilteredTasks } from "@/types/types";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Task search, sorting and paging", () => {
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

  async function createTask(title: string, priority: "low" | "medium" | "high") {
    const [task] = await db
      .insert(tasks)
      .values({
        workspaceId: fixture.workspaceA.id,
        title,
        description: null,
        status: "todo",
        priority,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        assigneeId: fixture.userA.id,
        createdBy: fixture.userA.id,
      })
      .returning();
    return task;
  }

  it("searches titles case-insensitively", async () => {
    await createTask("Write report", "high");
    await createTask("Review REPORT", "low");
    await createTask("Fix the bug", "medium");
    actAs(fixture.userA);

    const results = await getTasks(fixture.workspaceA.id, {
      status: "",
      priority: "",
      assignee: "",
      search: "report",
    });

    expect(results.map((task) => task.title).sort()).toEqual([
      "Review REPORT",
      "Write report",
    ]);
  });

  it("treats LIKE wildcards in the search term as literal characters", async () => {
    await createTask("100% done", "high");
    actAs(fixture.userA);

    const literal = await getTasks(fixture.workspaceA.id, {
      status: "",
      priority: "",
      assignee: "",
      search: "%",
    });
    const wildcard = await getTasks(fixture.workspaceA.id, {
      status: "",
      priority: "",
      assignee: "",
      search: "done",
    });

    expect(literal.map((task) => task.title)).toEqual(["100% done"]);
    expect(wildcard.map((task) => task.title)).toEqual(["100% done"]);
  });

  it("sorts by title alphabetically", async () => {
    await createTask("Zebra", "low");
    await createTask("Alpha", "high");
    actAs(fixture.userA);

    const results = await getTasks(fixture.workspaceA.id, {
      status: "",
      priority: "",
      assignee: "",
      sort: "title",
    });

    expect(results[0].title).toBe("Alpha");
    expect(results[1].title).toBe("Task in Workspace A");
    expect(results[2].title).toBe("Zebra");
  });

  it("sorts high priority first when requested", async () => {
    await createTask("Low priority", "low");
    await createTask("High priority", "high");
    actAs(fixture.userA);

    const results = await getTasks(fixture.workspaceA.id, {
      status: "",
      priority: "",
      assignee: "",
      sort: "priority",
    });

    expect(results[0].title).toBe("High priority");
    expect(results.at(-1)?.title).toBe("Low priority");
  });

  it("pages results and counts them with the same filter", async () => {
    await createTask("Page one", "high");
    await createTask("Page two", "medium");
    await createTask("Page three", "low");
    actAs(fixture.userA);

    const filter: GetFilteredTasks = {
      status: "",
      priority: "",
      assignee: "",
      search: "Page",
    };
    const first = await getTasks(fixture.workspaceA.id, filter, {
      page: 1,
      pageSize: 2,
    });
    const second = await getTasks(fixture.workspaceA.id, filter, {
      page: 2,
      pageSize: 2,
    });
    const total = await getTaskCount(fixture.workspaceA.id, filter);

    expect(first).toHaveLength(2);
    expect(second).toHaveLength(1);
    expect(new Set([...first, ...second].map((task) => task.id)).size).toBe(3);
    expect(total).toBe(3);
  });

  it("does not expose tasks to a non-member", async () => {
    actAs(fixture.userB);

    const filter: GetFilteredTasks = {
      status: "",
      priority: "",
      assignee: "",
    };

    await expect(getTasks(fixture.workspaceA.id, filter)).rejects.toThrow(
      "No access to this workspace",
    );
    await expect(
      getTaskCount(fixture.workspaceA.id, filter),
    ).rejects.toThrow("No access to this workspace");
  });
});
