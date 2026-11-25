import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { workspaceInvitations, workspaceMembers } from "@/db/schema";
import {
  acceptInvitation,
  inviteMember,
  listInvitations,
  revokeInvitation,
} from "@/actions/invitations";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Workspace invitations", () => {
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

  async function findInvite(email: string) {
    return db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.workspaceId, fixture.workspaceA.id),
        eq(workspaceInvitations.email, email.toLowerCase()),
      ),
    });
  }

  it("lets an owner invite an existing user and that user accept", async () => {
    actAs(fixture.userA);

    const invited = await inviteMember(
      fixture.workspaceA.id,
      fixture.userB.email,
      "member",
    );
    expect(invited.success).toBe(true);

    const invite = await findInvite(fixture.userB.email);
    expect(invite).toBeDefined();
    expect(invite?.role).toBe("member");

    actAs(fixture.userB);
    const accepted = await acceptInvitation(invite!.token);
    expect(accepted.success).toBe(true);

    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, fixture.workspaceA.id),
        eq(workspaceMembers.userId, fixture.userB.id),
      ),
    });
    expect(membership?.role).toBe("member");

    const usedInvite = await db.query.workspaceInvitations.findFirst({
      where: eq(workspaceInvitations.id, invite!.id),
    });
    expect(usedInvite?.acceptedAt).toBeTruthy();
  });

  it("rejects invitations from users without access", async () => {
    actAs(fixture.userB);

    const response = await inviteMember(
      fixture.workspaceA.id,
      "someone@test.local",
      "member",
    );

    expect(response.success).toBe(false);
    expect(await findInvite("someone@test.local")).toBeUndefined();
  });

  it("prevents admins from inviting other admins", async () => {
    await db.insert(workspaceMembers).values({
      workspaceId: fixture.workspaceA.id,
      userId: fixture.userB.id,
      role: "admin",
    });
    actAs(fixture.userB);

    const denied = await inviteMember(
      fixture.workspaceA.id,
      "new-admin@test.local",
      "admin",
    );
    expect(denied.success).toBe(false);

    const allowed = await inviteMember(
      fixture.workspaceA.id,
      "new-member@test.local",
      "member",
    );
    expect(allowed.success).toBe(true);
  });

  it("rejects duplicate pending invitations", async () => {
    actAs(fixture.userA);

    await inviteMember(fixture.workspaceA.id, fixture.userB.email, "member");
    const duplicate = await inviteMember(
      fixture.workspaceA.id,
      fixture.userB.email,
      "member",
    );

    expect(duplicate.success).toBe(false);
  });

  it("does not let a different account accept the invitation", async () => {
    actAs(fixture.userA);
    await inviteMember(fixture.workspaceA.id, fixture.userB.email, "member");
    const invite = await findInvite(fixture.userB.email);

    // User A's email does not match the invitation, even though they are
    // already an owner of the workspace.
    const accepted = await acceptInvitation(invite!.token);

    expect(accepted.success).toBe(false);
    expect(invite?.acceptedAt).toBeNull();
  });

  it("lists and revokes pending invitations", async () => {
    actAs(fixture.userA);
    await inviteMember(fixture.workspaceA.id, fixture.userB.email, "member");

    const pending = await listInvitations(fixture.workspaceA.id);
    expect(pending).toHaveLength(1);

    const revoked = await revokeInvitation(
      fixture.workspaceA.id,
      pending[0].id,
    );
    expect(revoked.success).toBe(true);
    expect(await listInvitations(fixture.workspaceA.id)).toHaveLength(0);
  });
});
