import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTwoUsersAndWorkspaces,
  cleanupTestFixture,
  actAs,
  clearSession,
  TestFixture,
} from '@/tests/helpers';
import { requireUser } from '@/lib/authguard';
import { getCurrentUser } from '@/actions/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';

describe('Test Helpers & Session Mocking', () => {
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

  it('creates two distinct users and workspaces, each with one task', () => {
    // Users
    expect(fixture.userA.id).toBeDefined();
    expect(fixture.userB.id).toBeDefined();
    expect(fixture.userA.id).not.toBe(fixture.userB.id);

    // Workspaces
    expect(fixture.workspaceA.id).toBeDefined();
    expect(fixture.workspaceB.id).toBeDefined();
    expect(fixture.workspaceA.ownerId).toBe(fixture.userA.id);
    expect(fixture.workspaceB.ownerId).toBe(fixture.userB.id);

    // Memberships
    expect(fixture.memberA.workspaceId).toBe(fixture.workspaceA.id);
    expect(fixture.memberA.role).toBe('owner');
    expect(fixture.memberB.workspaceId).toBe(fixture.workspaceB.id);
    expect(fixture.memberB.role).toBe('owner');

    // Tasks
    expect(fixture.taskA.workspaceId).toBe(fixture.workspaceA.id);
    expect(fixture.taskA.assigneeId).toBe(fixture.userA.id);
    expect(fixture.taskB.workspaceId).toBe(fixture.workspaceB.id);
    expect(fixture.taskB.assigneeId).toBe(fixture.userB.id);
  });

  it('acts as user A and enforces workspace access correctly', async () => {
    actAs(fixture.userA);

    // requireUser returns user A
    const current = await requireUser();
    expect(current.id).toBe(fixture.userA.id);

    // getCurrentUser returns DB user A
    const dbUser = await getCurrentUser();
    expect(dbUser?.id).toBe(fixture.userA.id);

    // User A has owner access to Workspace A
    const accessA = await requireWorkspaceAccess(fixture.workspaceA.id, 'owner');
    expect(accessA.role).toBe('owner');
    expect(accessA.user.id).toBe(fixture.userA.id);

    // User A cannot access Workspace B
    await expect(
      requireWorkspaceAccess(fixture.workspaceB.id, 'member')
    ).rejects.toThrow('No access to this workspace');
  });

  it('acts as user B and enforces workspace access correctly', async () => {
    actAs(fixture.userB);

    // requireUser returns user B
    const current = await requireUser();
    expect(current.id).toBe(fixture.userB.id);

    // getCurrentUser returns DB user B
    const dbUser = await getCurrentUser();
    expect(dbUser?.id).toBe(fixture.userB.id);

    // User B has owner access to Workspace B
    const accessB = await requireWorkspaceAccess(fixture.workspaceB.id, 'owner');
    expect(accessB.role).toBe('owner');
    expect(accessB.user.id).toBe(fixture.userB.id);

    // User B cannot access Workspace A
    await expect(
      requireWorkspaceAccess(fixture.workspaceA.id, 'member')
    ).rejects.toThrow('No access to this workspace');
  });

  it('acts as unauthenticated when session is cleared', async () => {
    clearSession();

    await expect(requireUser()).rejects.toThrow('Unauthorized');

    const dbUser = await getCurrentUser();
    expect(dbUser).toBeUndefined();
  });
});
