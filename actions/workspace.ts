"use server";

import { db } from "@/db";
import { user, workspaceMembers, workspaces } from "@/db/schema";
import { getCurrentUser } from "./auth";
import { and, eq } from "drizzle-orm";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import { idSchema, nameSchema, validationMessage } from "@/lib/validation";

export const createWorkspace = async (name: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw "User not logged in!";

    const parsedName = nameSchema.safeParse(name);
    if (!parsedName.success) {
      return { success: false, message: validationMessage(parsedName.error) };
    }

    const workspace = await db
      .insert(workspaces)
      .values({ name: parsedName.data, ownerId: user.id })
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
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedName = nameSchema.safeParse(newName);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedName.success) {
      return { success: false, message: validationMessage(parsedName.error) };
    }

    await requireWorkspaceAccess(parsedWorkspaceId.data, "owner");
    await db
      .update(workspaces)
      .set({
        name: parsedName.data,
      })
      .where(eq(workspaces.id, parsedWorkspaceId.data));

    return { success: true, message: "Workspace name updated!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not update worspace name" };
  }
};

export const removeUser = async (workspaceId: string, userId: string) => {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedUserId = idSchema.safeParse(userId);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedUserId.success) {
      return { success: false, message: validationMessage(parsedUserId.error) };
    }

    const { user: actor, role: actorRole } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "admin",
    );

    if (actor.id === parsedUserId.data) {
      return { success: false, message: "You cannot remove yourself" };
    }

    const target = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
        eq(workspaceMembers.userId, parsedUserId.data),
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
          eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
          eq(workspaceMembers.userId, parsedUserId.data),
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
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedTargetUserId = idSchema.safeParse(targetUserId);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedTargetUserId.success) {
      return {
        success: false,
        message: validationMessage(parsedTargetUserId.error),
      };
    }

    const { user: currentUser, role: executingRole } =
      await requireWorkspaceAccess(parsedWorkspaceId.data, "member");

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

    if (currentUser.id === parsedTargetUserId.data) {
      return { success: false, message: "You cannot change your own role" };
    }

    const targetMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
        eq(workspaceMembers.userId, parsedTargetUserId.data),
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
          eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
          eq(workspaceMembers.userId, parsedTargetUserId.data),
        ),
      );

    return { success: true, message: "Role updated successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occurred" };
  }
};

export const transferOwnership = async (
  workspaceId: string,
  newOwnerId: string,
) => {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedNewOwnerId = idSchema.safeParse(newOwnerId);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedNewOwnerId.success) {
      return {
        success: false,
        message: validationMessage(parsedNewOwnerId.error),
      };
    }

    const { user: currentUser } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "owner",
    );

    if (currentUser.id === parsedNewOwnerId.data) {
      return { success: false, message: "You are already the owner" };
    }

    const target = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
        eq(workspaceMembers.userId, parsedNewOwnerId.data),
      ),
    });

    if (!target) {
      return { success: false, message: "Member not found" };
    }

    if (target.role === "owner") {
      return { success: false, message: "This member is already the owner" };
    }

    // The single-owner index means the old owner has to step down before the
    // new owner is promoted. The batch keeps that gap invisible.
    await db.batch([
      db
        .update(workspaceMembers)
        .set({ role: "admin" })
        .where(
          and(
            eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
            eq(workspaceMembers.userId, currentUser.id),
          ),
        ),
      db
        .update(workspaceMembers)
        .set({ role: "owner" })
        .where(
          and(
            eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
            eq(workspaceMembers.userId, parsedNewOwnerId.data),
          ),
        ),
      db
        .update(workspaces)
        .set({ ownerId: parsedNewOwnerId.data })
        .where(eq(workspaces.id, parsedWorkspaceId.data)),
    ]);

    return { success: true, message: "Ownership transferred!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not transfer ownership" };
  }
};

export const deleteWorkspace = async (workspaceId: string) => {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, message: "Unauthorized" };

    const memberRecord = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
        eq(workspaceMembers.userId, currentUser.id),
      ),
    });

    if (!memberRecord || memberRecord.role !== "owner") {
      return { success: false, message: "Only owner can delete workspace" };
    }

    await db
      .delete(workspaces)
      .where(eq(workspaces.id, parsedWorkspaceId.data));

    return { success: true, message: "Workspace deleted!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error deleting workspace" };
  }
};
