"use server";

import { db } from "@/db";
import { user, workspaceMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireWorkspaceAccess } from "@/lib/workspace-access";

export async function updateUser(newName: string, id: string) {
  try {
    await db.update(user).set({ name: newName }).where(eq(user.id, id));

    return { success: true, message: "Name updated!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occured!" };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const userObj = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email));

    return userObj[0];
  } catch (error) {
    console.error(error);
  }
}

export async function addMember(
  workspaceId: string,
  role: string,
  email: string,
) {
  try {
    const { user: currentUser, role: currentUserRole } =
      await requireWorkspaceAccess(workspaceId, "admin");

    // Ownership is unique and can only change through an explicit transfer.
    if (role !== "admin" && role !== "member") {
      return { success: false, message: "Invalid role" };
    }

    if (currentUserRole === "admin" && role === "admin") {
      return { success: false, message: "Admins can only add members" };
    }

    const targetUser = await getUserByEmail(email);

    if (!targetUser || !targetUser.id)
      return { success: false, message: `User of email ${email} not found!` };

    if (currentUser.id === targetUser.id) {
      return { success: false, message: "You cannot add yourself" };
    }

    const [existingUser] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, targetUser.id),
          eq(workspaceMembers.workspaceId, workspaceId),
        ),
      );

    if (existingUser)
      return {
        success: false,
        message: "User already exists in the workspace",
      };

    await db.insert(workspaceMembers).values({
      userId: targetUser.id,
      workspaceId: workspaceId,
      role: role,
    });

    return { success: true, message: "User added to workspace" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not add user to workspace" };
  }
}
