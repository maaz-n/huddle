import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tasks, user, workspaces } from "@/db/schema";
import { auth } from "@/lib/auth";
import { DEMO_EMAIL, DEMO_MEMBERS, DEMO_PASSWORD } from "@/lib/demo";
import { seedDemoData } from "@/lib/demo-seed";
import { demoLogin, resetDemo } from "@/actions/demo";
import {
  deleteWorkspace,
  removeUser,
  transferOwnership,
  updateWorkspaceName,
} from "@/actions/workspace";
import { addMember, updateEmailNotifications, updateUser } from "@/actions/user";
import { inviteMember } from "@/actions/invitations";
import { uploadAvatar } from "@/actions/avatar";
import {
  actAs,
  cleanupTestFixture,
  clearSession,
  createTwoUsersAndWorkspaces,
  TestFixture,
} from "@/tests/helpers";

describe("Demo mode", () => {
  let fixture: TestFixture | undefined;

  vi.setConfig({ testTimeout: 20_000 });

  beforeEach(async () => {
    fixture = await createTwoUsersAndWorkspaces();
  });

  afterEach(async () => {
    clearSession();

    const emails = [DEMO_EMAIL, ...DEMO_MEMBERS.map((member) => member.email)];
    for (const email of emails) {
      await db.delete(user).where(eq(user.email, email));
    }
    await db.delete(workspaces).where(eq(workspaces.isDemo, true));

    if (fixture) {
      await cleanupTestFixture(fixture);
      fixture = undefined;
    }
  });

  it("signs into a seeded demo workspace with the demo credentials", async () => {
    const signIn = vi
      .spyOn(auth.api, "signInEmail")
      .mockResolvedValue({ status: true } as never);

    const result = await demoLogin();

    expect(result.success).toBe(true);
    expect(signIn).toHaveBeenCalledWith({
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, result.workspaceId!),
    });
    expect(workspace?.isDemo).toBe(true);

    const seeded = await db
      .select()
      .from(tasks)
      .where(eq(tasks.workspaceId, workspace!.id));
    expect(seeded).toHaveLength(6);
    expect(seeded.some((task) => task.recurrence !== "none")).toBe(true);
  });

  it("seeding twice leaves one demo workspace with the same content", async () => {
    await seedDemoData({ reset: true });
    const first = await seedDemoData({ reset: true });

    const all = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.isDemo, true));
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(first.workspaceId);

    const seeded = await db
      .select()
      .from(tasks)
      .where(eq(tasks.workspaceId, first.workspaceId));
    expect(seeded).toHaveLength(6);
  });

  it("only lets the demo user reset the demo", async () => {
    const { userId } = await seedDemoData();
    const demoUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    clearSession();
    expect((await resetDemo()).success).toBe(false);

    actAs(demoUser!);
    expect((await resetDemo()).success).toBe(true);
  });

  it("blocks destructive workspace actions in demo mode", async () => {
    const { workspaceId, userId } = await seedDemoData();
    const demoUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    const teammate = await db.query.user.findFirst({
      where: eq(user.email, DEMO_MEMBERS[0].email),
    });
    actAs(demoUser!);

    expect((await deleteWorkspace(workspaceId)).success).toBe(false);
    expect((await updateWorkspaceName(workspaceId, "Hacked")).success).toBe(false);
    expect(
      (await transferOwnership(workspaceId, teammate!.id)).success,
    ).toBe(false);
    expect((await removeUser(workspaceId, teammate!.id)).success).toBe(false);
    expect(
      (await addMember(workspaceId, "member", fixture!.userB.email)).success,
    ).toBe(false);
    expect(
      (await inviteMember(workspaceId, "outsider@test.local", "member")).success,
    ).toBe(false);
  });

  it("blocks demo profile changes and avatar uploads", async () => {
    const { userId } = await seedDemoData();
    const demoUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    actAs(demoUser!);

    expect((await updateUser("Changed name")).success).toBe(false);
    expect((await updateEmailNotifications(true)).success).toBe(false);

    const formData = new FormData();
    formData.set(
      "file",
      new File([new Uint8Array([1, 2, 3])], "avatar.png", {
        type: "image/png",
      }),
    );
    expect((await uploadAvatar(formData)).success).toBe(false);
  });
});
