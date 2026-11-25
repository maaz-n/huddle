"use server";

import { db } from "@/db";
import { user, workspaceMembers, workspaces } from "@/db/schema";
import { getCurrentUser } from "./auth";
import { and, eq } from "drizzle-orm";
import { requireWorkspaceAccess } from "@/lib/workspace-access";

export const createWorkspace = async (name: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw "User not logged in!";
    const workspace = await db
      .insert(workspaces)
      .values({ name: name, ownerId: user.id })
      .returning();
    await db
      .insert(workspaceMembers)
      .values({ workspaceId: workspace[0].id, userId: user.id, role: "owner" });
    return {
      success: true,
      message: "Workspace created!",
      workspace: workspace[0],
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "There was an error creating the workspace",
    };
  }
};

export const getWorkspacesWithRoles = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];
  const workspaceswithRoles = await db
    .select({
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, currentUser.id))
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id));

  return workspaceswithRoles;
};

export const getWorkspace = async (workspaceId: string) => {
  await requireWorkspaceAccess(workspaceId, "member");
  const response = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      ownerId: workspaces.ownerId,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId));
  return response[0];
};

export const getWorkspaceUsers = async (workspaceId: string) => {
  await requireWorkspaceAccess(workspaceId, "member");
  return await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: workspaceMembers.role,
      image: user.image,
    })
    .from(user)
    .innerJoin(workspaceMembers, eq(workspaceMembers.userId, user.id))
    .where(eq(workspaceMembers.workspaceId, workspaceId));
};

export const updateWorkspaceName = async (
  workspaceId: string,
  newName: string,
) => {
  try {
    await requireWorkspaceAccess(workspaceId, "owner")
    await db
      .update(workspaces)
      .set({
        name: newName,
      })
      .where(eq(workspaces.id, workspaceId));

    return { success: true, message: "Workspace name updated!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update worspace name" };
  }
};

export const removeUser = async (workspaceId: string, userId: string) => {
  try {
    const { user: actor, role: actorRole } = await requireWorkspaceAccess(
      workspaceId,
      "admin",
    );

    if (actor.id === userId) {
      return { success: false, message: "You cannot remove yourself" };
    }

    const target = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    });

    if (!target) {
      return { success: false, message: "Member not found" };
    }

    // The workspace has exactly one owner and that membership is protected.
    if (target.role === "owner") {
      return {
        success: false,
        message: "The workspace owner cannot be removed",
      };
    }

    // Admins may only remove regular members.
    if (actorRole === "admin" && target.role !== "member") {
      return { success: false, message: "Admins can only remove members" };
    }

    await db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ),
      );

    return { success: true, message: "User removed from workspace!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not remove user from workspace" };
  }
};

export const updateUserRole = async (
  workspaceId: string,
  targetUserId: string,
  newRole: "admin" | "member" | "owner",
) => {
  try {
    const { user: currentUser, role: executingRole } =
      await requireWorkspaceAccess(workspaceId, "member");

    if (executingRole !== "owner") {
      return { success: false, message: "Only the owner can change roles" };
    }

    // Ownership is unique and can only change through an explicit transfer.
    if (newRole !== "admin" && newRole !== "member") {
      return {
        success: false,
        message: "Ownership must be transferred, not assigned",
      };
    }

    if (currentUser.id === targetUserId) {
      return { success: false, message: "You cannot change your own role" };
    }

    const targetMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, targetUserId),
      ),
    });

    if (!targetMember) {
      return { success: false, message: "Member not found" };
    }

    if (targetMember.role === "owner") {
      return { success: false, message: "The owner's role cannot be changed" };
    }

    await db
      .update(workspaceMembers)
      .set({ role: newRole })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUserId),
        ),
      );

    return { success: true, message: "Role updated successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred" };
  }
};

export const deleteWorkspace = async (workspaceId: string) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, message: "Unauthorized" };

    const memberRecord = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, currentUser.id),
      ),
    });

    if (!memberRecord || memberRecord.role !== "owner") {
      return { success: false, message: "Only owner can delete workspace" };
    }

    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

    return { success: true, message: "Workspace deleted!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error deleting workspace" };
  }
};
