import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTwoUsersAndWorkspaces,
  cleanupTestFixture,
  actAs,
  clearSession,
  TestFixture,
} from '@/tests/helpers';
import { getTasks, getMyTasks, getTaskStats } from '@/actions/tasks';
import { getWorkspace, getWorkspaceUsers } from '@/actions/workspace';
import { getRecentActivity, getDashboardStats } from '@/actions/activity';
import TasksPage from '@/app/(main pages)/tasks/page';
import MyTasksPage from '@/app/(main pages)/my-tasks/page';
import MembersPage from '@/app/(main pages)/members/page';
import SettingsPage from '@/app/(main pages)/settings/page';
import DashboardPage from '@/app/(main pages)/page';

describe('Multi-tenant Isolation & Read Access Control', () => {
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

  describe('1. getTasks filter isolation', () => {
    it('does NOT leak Workspace B tasks to User A when applying a filter', async () => {
      actAs(fixture.userA);

      // User A filters tasks in Workspace A by status: "todo"
      const tasks = await getTasks(fixture.workspaceA.id, {
        status: 'todo',
        priority: '',
        assignee: '',
      });

      // Verification: Task B from Workspace B must NOT be in the results
      const leakedTaskB = tasks.find((t) => t.id === fixture.taskB.id);
      expect(leakedTaskB).toBeUndefined();

      // All returned tasks must belong exclusively to Workspace A
      expect(tasks.every((t) => t.workspaceId === fixture.workspaceA.id)).toBe(true);
    });
  });

  describe('2. requireWorkspaceAccess on all read actions', () => {
    it('getWorkspace requires workspace access', async () => {
      // User B cannot read Workspace A
      actAs(fixture.userB);
      await expect(getWorkspace(fixture.workspaceA.id)).rejects.toThrow(
        'No access to this workspace'
      );

      // User A can read Workspace A
      actAs(fixture.userA);
      const ws = await getWorkspace(fixture.workspaceA.id);
      expect(ws.id).toBe(fixture.workspaceA.id);
    });

    it('getWorkspaceUsers requires workspace access', async () => {
      // User B cannot read members of Workspace A
      actAs(fixture.userB);
      await expect(getWorkspaceUsers(fixture.workspaceA.id)).rejects.toThrow(
        'No access to this workspace'
      );

      // User A can read members of Workspace A
      actAs(fixture.userA);
      const members = await getWorkspaceUsers(fixture.workspaceA.id);
      expect(members.some((m) => m.id === fixture.userA.id)).toBe(true);
      expect(members.some((m) => m.id === fixture.userB.id)).toBe(false);
    });

    it('getRecentActivity requires workspace access', async () => {
      // User B cannot read activity of Workspace A
      actAs(fixture.userB);
      await expect(getRecentActivity(fixture.workspaceA.id)).rejects.toThrow(
        'No access to this workspace'
      );

      // User A can read activity of Workspace A
      actAs(fixture.userA);
      const activity = await getRecentActivity(fixture.workspaceA.id);
      expect(Array.isArray(activity)).toBe(true);
    });

    it('getDashboardStats requires workspace access', async () => {
      // User B cannot query dashboard stats for Workspace A
      actAs(fixture.userB);
      await expect(
        getDashboardStats(fixture.userB.id, fixture.workspaceA.id)
      ).rejects.toThrow('No access to this workspace');

      // User A can query dashboard stats for Workspace A
      actAs(fixture.userA);
      const count = await getDashboardStats(fixture.userA.id, fixture.workspaceA.id);
      expect(typeof count).toBe('number');
    });

    it('getMyTasks requires workspace access', async () => {
      // User B cannot read myTasks from Workspace A
      actAs(fixture.userB);
      await expect(getMyTasks(fixture.workspaceA.id)).rejects.toThrow(
        'No access to this workspace'
      );

      // User A can read their tasks from Workspace A
      actAs(fixture.userA);
      const tasks = await getMyTasks(fixture.workspaceA.id);
      expect(tasks.some((t) => t.id === fixture.taskA.id)).toBe(true);
    });

    it('getTaskStats requires workspace access', async () => {
      // User B cannot read task stats for Workspace A
      actAs(fixture.userB);
      await expect(getTaskStats(fixture.workspaceA.id)).rejects.toThrow(
        'No access to this workspace'
      );

      // User A can read task stats for Workspace A
      actAs(fixture.userA);
      const stats = await getTaskStats(fixture.workspaceA.id);
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('3. Page redirects when role is null', () => {
    it('redirects when user has no role in workspace', async () => {
      // Act as User B, but attempt to access Workspace A
      actAs(fixture.userB);

      // Next.js redirect() throws a redirect error
      await expect(
        DashboardPage({ searchParams: Promise.resolve({ workspace: fixture.workspaceA.id }) })
      ).rejects.toThrow();

      await expect(
        TasksPage({ searchParams: Promise.resolve({ workspace: fixture.workspaceA.id }) })
      ).rejects.toThrow();

      await expect(
        MyTasksPage({ searchParams: Promise.resolve({ workspace: fixture.workspaceA.id }) })
      ).rejects.toThrow();

      await expect(
        MembersPage({ searchParams: Promise.resolve({ workspace: fixture.workspaceA.id }) })
      ).rejects.toThrow();

      await expect(
        SettingsPage({ searchParams: Promise.resolve({ workspace: fixture.workspaceA.id }) })
      ).rejects.toThrow();
    });
  });
});
