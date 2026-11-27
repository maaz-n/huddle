import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { activityLogs, workspaceMembers } from "@/db/schema";
import { addMember } from "@/actions/user";
import { inviteMember, listInvitations, revokeInvitation } from "@/actions/invitations";
import {
  removeUser,
  transferOwnership,
  updateUserRole,
  updateWorkspaceName,
} from "@/actions/workspace";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Workspace audit log", () => {
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

  async function logsFor(workspaceId: string) {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.workspaceId, workspaceId))
      .orderBy(desc(activityLogs.createdAt));
  }

  async function addUserB(role: "member" | "admin" = "member") {
    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role,
    });
  }

  it("records a workspace rename with old and new names", async () => {
    actAs(fixture.userA);

    const result = await updateWorkspaceName(
      fixture.workspaceA.id,
      "Renamed workspace",
    );
    expect(result.success).toBe(true);

    const [log] = await logsFor(fixture.workspaceA.id);
    expect(log.action).toBe("WORKSPACE_RENAMED");
    expect(log.actorId).toBe(fixture.userA.id);
    expect(log.metadata?.entityName).toBe("Renamed workspace");
    expect(log.metadata?.oldName).toBe("Workspace A");
  });

  it("records a member being added", async () => {
    actAs(fixture.userA);

    const result = await addMember(
      fixture.workspaceA.id,
      "member",
      fixture.userB.email,
    );
    expect(result.success).toBe(true);

    const [log] = await logsFor(fixture.workspaceA.id);
    expect(log.action).toBe("MEMBER_ADDED");
    expect(log.actorId).toBe(fixture.userA.id);
    expect(log.metadata?.entityName).toBe(fixture.userB.name);
    expect(log.metadata?.role).toBe("member");
  });

  it("records a role change with the previous role", async () => {
    await addUserB("member");
    actAs(fixture.userA);

    const result = await updateUserRole(
      fixture.workspaceA.id,
      fixture.userB.id,
      "admin",
    );
    expect(result.success).toBe(true);

    const [log] = await logsFor(fixture.workspaceA.id);
    expect(log.action).toBe("MEMBER_ROLE_CHANGED");
    expect(log.metadata?.entityName).toBe(fixture.userB.name);
    expect(log.metadata?.oldRole).toBe("member");
    expect(log.metadata?.role).toBe("admin");
  });

  it("records a member being removed", async () => {
    await addUserB("member");
    actAs(fixture.userA);

    const result = await removeUser(fixture.workspaceA.id, fixture.userB.id);
    expect(result.success).toBe(true);

    const [log] = await logsFor(fixture.workspaceA.id);
    expect(log.action).toBe("MEMBER_REMOVED");
    expect(log.metadata?.entityName).toBe(fixture.userB.name);
  });

  it("records an ownership transfer", async () => {
    await addUserB("member");
    actAs(fixture.userA);

    const result = await transferOwnership(
      fixture.workspaceA.id,
      fixture.userB.id,
    );
    expect(result.success).toBe(true);

    const [log] = await logsFor(fixture.workspaceA.id);
    expect(log.action).toBe("OWNERSHIP_TRANSFERRED");
    expect(log.metadata?.entityName).toBe(fixture.userB.name);
  });

  it("records invitations being sent and revoked", async () => {
    actAs(fixture.userA);

    const sent = await inviteMember(
      fixture.workspaceA.id,
      "invitee@test.local",
      "member",
    );
    expect(sent.success).toBe(true);

    const [invitation] = await listInvitations(fixture.workspaceA.id);
    const revoked = await revokeInvitation(
      fixture.workspaceA.id,
      invitation.id,
    );
    expect(revoked.success).toBe(true);

    const logs = await logsFor(fixture.workspaceA.id);
    expect(logs.map((log) => log.action)).toEqual([
      "INVITATION_REVOKED",
      "INVITATION_SENT",
    ]);
    expect(logs[0].metadata?.entityName).toBe("invitee@test.local");
    expect(logs[1].metadata?.role).toBe("member");
  });
});
