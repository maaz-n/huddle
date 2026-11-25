import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { workspaceMembers, workspaces } from "@/db/schema";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";
import { transferOwnership } from "@/actions/workspace";

describe("Workspace ownership transfer", () => {
  let fixture: TestFixture;

  beforeEach(async () => {
    fixture = await createTwoUsersAndWorkspaces();

    // Add User B to Workspace A so there is somebody to transfer to.
    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "admin",
    });
  });

  afterEach(async () => {
    clearSession();
    if (fixture) {
      await cleanupTestFixture(fixture);
    }
  });

  async function getRoles() {
    const members = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, fixture.workspaceA.id),
    });

    return Object.fromEntries(members.map((member) => [member.userId, member.role]));
  }

  it("moves ownership to another member and keeps a single owner", async () => {
    actAs(fixture.userA);

    const response = await transferOwnership(
      fixture.workspaceA.id,
      fixture.userB.id,
    );

    expect(response.success).toBe(true);

    const roles = await getRoles();
    expect(roles[fixture.userA.id]).toBe("admin");
    expect(roles[fixture.userB.id]).toBe("owner");
    expect(Object.values(roles).filter((role) => role === "owner")).toHaveLength(
      1,
    );

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, fixture.workspaceA.id),
    });
    expect(workspace?.ownerId).toBe(fixture.userB.id);
  });

  it("rejects transfers from non-owners", async () => {
    actAs(fixture.userB);

    const response = await transferOwnership(
      fixture.workspaceA.id,
      fixture.userA.id,
    );

    expect(response.success).toBe(false);
    const roles = await getRoles();
    expect(roles[fixture.userA.id]).toBe("owner");
  });

  it("rejects transferring ownership to yourself", async () => {
    actAs(fixture.userA);

    const response = await transferOwnership(
      fixture.workspaceA.id,
      fixture.userA.id,
    );

    expect(response.success).toBe(false);
    const roles = await getRoles();
    expect(roles[fixture.userA.id]).toBe("owner");
  });
});
