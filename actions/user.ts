"use server";

import { db } from "@/db";
import { user, workspaceMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import {
  emailSchema,
  idSchema,
  memberRoleSchema,
  nameSchema,
  validationMessage,
} from "@/lib/validation";
import { getCurrentUser } from "./auth";

export async function updateUser(newName: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: "Unauthorized" };
    }

    const parsedName = nameSchema.safeParse(newName);
    if (!parsedName.success) {
      return { success: false, message: validationMessage(parsedName.error) };
    }

    await db
      .update(user)
      .set({ name: parsedName.data })
      .where(eq(user.id, currentUser.id));

    return { success: true, message: "Name updated!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An error occured!" };
  }
}

async function getUserByEmail(email: string) {
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
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedRole = memberRoleSchema.safeParse(role);
    const parsedEmail = emailSchema.safeParse(email);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedRole.success) {
      return { success: false, message: validationMessage(parsedRole.error) };
    }
    if (!parsedEmail.success) {
      return { success: false, message: validationMessage(parsedEmail.error) };
    }

    const { user: currentUser, role: currentUserRole } =
      await requireWorkspaceAccess(parsedWorkspaceId.data, "admin");

    if (currentUserRole === "admin" && parsedRole.data === "admin") {
      return { success: false, message: "Admins can only add members" };
    }

    const targetUser = await getUserByEmail(parsedEmail.data);

    if (!targetUser || !targetUser.id)
      return {
        success: false,
        message: `User of email ${parsedEmail.data} not found!`,
      };

    if (currentUser.id === targetUser.id) {
      return { success: false, message: "You cannot add yourself" };
    }

    const [existingUser] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, targetUser.id),
          eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
        ),
      );

    if (existingUser)
      return {
        success: false,
        message: "User already exists in the workspace",
      };

    await db.insert(workspaceMembers).values({
      userId: targetUser.id,
      workspaceId: parsedWorkspaceId.data,
      role: parsedRole.data,
    });

    return { success: true, message: "User added to workspace" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not add user to workspace" };
  }
}
