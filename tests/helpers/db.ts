import { db } from "@/db";
import { user, workspaces, workspaceMembers, tasks } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export type TestFixture = {
  userA: typeof user.$inferSelect;
  userB: typeof user.$inferSelect;
  workspaceA: typeof workspaces.$inferSelect;
  workspaceB: typeof workspaces.$inferSelect;
  taskA: typeof tasks.$inferSelect;
  taskB: typeof tasks.$inferSelect;
  memberA: typeof workspaceMembers.$inferSelect;
  memberB: typeof workspaceMembers.$inferSelect;
};

export type CreateFixtureOptions = {
  userAName?: string;
  userBName?: string;
  workspaceAName?: string;
  workspaceBName?: string;
  taskATitle?: string;
  taskBTitle?: string;
};

/**
 * Creates two users (User A and User B) and two workspaces (Workspace A and Workspace B),
 * each with one task.
 *
 * - Workspace A is owned by User A (role: "owner") and contains Task A (assigned to User A).
 * - Workspace B is owned by User B (role: "owner") and contains Task B (assigned to User B).
 *
 * Foreign keys and memberships are set up properly so tests can exercise real queries and RBAC.
 */
export async function createTwoUsersAndWorkspaces(
  options: CreateFixtureOptions = {}
): Promise<TestFixture> {
  const uniqueId = randomUUID().slice(0, 8);

  // 1. Create Users
  const userAId = randomUUID();
  const userBId = randomUUID();

  const [userA] = await db
    .insert(user)
    .values({
      id: userAId,
      name: options.userAName ?? "User A",
      email: `user-a-${uniqueId}@test.local`,
      emailVerified: true,
    })
    .returning();

  const [userB] = await db
    .insert(user)
    .values({
      id: userBId,
      name: options.userBName ?? "User B",
      email: `user-b-${uniqueId}@test.local`,
      emailVerified: true,
    })
    .returning();

  // 2. Create Workspaces and owner memberships
  const [workspaceA] = await db
    .insert(workspaces)
    .values({
      name: options.workspaceAName ?? "Workspace A",
      ownerId: userA.id,
    })
    .returning();

  const [memberA] = await db
    .insert(workspaceMembers)
    .values({
      workspaceId: workspaceA.id,
      userId: userA.id,
      role: "owner",
    })
    .returning();

  const [workspaceB] = await db
    .insert(workspaces)
    .values({
      name: options.workspaceBName ?? "Workspace B",
      ownerId: userB.id,
    })
    .returning();

  const [memberB] = await db
    .insert(workspaceMembers)
    .values({
      workspaceId: workspaceB.id,
      userId: userB.id,
      role: "owner",
    })
    .returning();

  // 3. Create One Task in Workspace A and One Task in Workspace B
  const [taskA] = await db
    .insert(tasks)
    .values({
      workspaceId: workspaceA.id,
      title: options.taskATitle ?? "Task in Workspace A",
      description: "Initial task for Workspace A",
      status: "todo",
      priority: "medium",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assigneeId: userA.id,
      createdBy: userA.id,
    })
    .returning();

  const [taskB] = await db
    .insert(tasks)
    .values({
      workspaceId: workspaceB.id,
      title: options.taskBTitle ?? "Task in Workspace B",
      description: "Initial task for Workspace B",
      status: "todo",
      priority: "high",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      assigneeId: userB.id,
      createdBy: userB.id,
    })
    .returning();

  return {
    userA,
    userB,
    workspaceA,
    workspaceB,
    taskA,
    taskB,
    memberA,
    memberB,
  };
}

/**
 * Convenience alias for createTwoUsersAndWorkspaces.
 */
export const setupTestFixture = createTwoUsersAndWorkspaces;

/**
 * Cleans up all data created for the test fixture.
 * Because all related tables (workspaces, workspace_members, tasks, activity_logs)
 * cascade on user deletion, deleting the users safely cleans up the entire fixture graph.
 */
export async function cleanupTestFixture(fixture: {
  userA?: { id: string };
  userB?: { id: string };
}) {
  const userIds: string[] = [];
  if (fixture.userA?.id) userIds.push(fixture.userA.id);
  if (fixture.userB?.id) userIds.push(fixture.userB.id);

  if (userIds.length > 0) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
}
