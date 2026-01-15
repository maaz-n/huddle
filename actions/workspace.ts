"use server"

import { db } from "@/db"
import { user, workspaceMembers, workspaces } from "@/db/schema"
import { getCurrentUser } from "./auth"
import { and, eq } from "drizzle-orm"

export const createWorkspace = async (name: string) => {
    try {
        const user = await getCurrentUser();
        if (!user) throw ("User not logged in!")
        const workspace = await db.insert(workspaces).values({ name: name, ownerId: user.id }).returning();
        await db.insert(workspaceMembers).values({ workspaceId: workspace[0].id, userId: user.id, role: "owner" })
        return { success: true, message: "Workspace created!" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "There was an error creating the workspace" }
    }
}

export const getWorkspacesWithRoles = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    const workspaceswithRoles = await db.select({
        workspaceId: workspaces.id,
        workspaceName: workspaces.name,
        role: workspaceMembers.role
    }).from(workspaceMembers).where(eq(workspaceMembers.userId, currentUser.id)).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))

    return workspaceswithRoles
}

export const getWorkspace = async (workspaceId: string) => {
    const response = await db.select({
        id: workspaces.id,
        name: workspaces.name,
        ownerId: workspaces.ownerId
    })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
    return response[0]
}

export const getWorkspaceUsers = async (workspaceId: string) => {
    return await db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: workspaceMembers.role,
        image: user.image
    })
        .from(user)
        .innerJoin(workspaceMembers, eq(workspaceMembers.userId, user.id))
        .where(eq(workspaceMembers.workspaceId, workspaceId))
}

export const updateWorkspaceName = async (workspaceId: string, newName: string) => {
    try {
        await db.update(workspaces).set({
            name: newName,
        }).where(eq(workspaces.id, workspaceId))

        return { success: true, message: "Workspace name updated!" }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Could not update worspace name" }
    }
}

export const removeUser = async (workspaceId: string, userId: string) => {
    try {
        await db.delete(workspaceMembers)
            .where(and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, userId)
            ))

        return { success: true, message: "User removed from workspace!" }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Could not remove user from workspace" }
    }
}

export const updateUserRole = async (
    workspaceId: string,
    targetUserId: string,
    newRole: "admin" | "member" | "owner"
) => {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return { success: false, message: "Unauthorized" };

        const [executingMember, targetMember] = await Promise.all([
            db.query.workspaceMembers.findFirst({
                where: and(
                    eq(workspaceMembers.workspaceId, workspaceId),
                    eq(workspaceMembers.userId, currentUser.id)
                )
            }),
            db.query.workspaceMembers.findFirst({
                where: and(
                    eq(workspaceMembers.workspaceId, workspaceId),
                    eq(workspaceMembers.userId, targetUserId)
                )
            })
        ]);

        if (!executingMember || !targetMember) {
            return { success: false, message: "Member not found" };
        }


        if (currentUser.id === targetUserId) {
            return { success: false, message: "You cannot change your own role" };
        }

        if (executingMember.role === "admin" && targetMember.role === "admin") {
            return { success: false, message: "Admins cannot manage other Admins" };
        }

        if (executingMember.role === "admin" && newRole === "owner") {
            return { success: false, message: "Only Owners can appoint new Owners" };
        }

        if (executingMember.role === "member") {
            return { success: false, message: "Permission denied" };
        }

        await db.update(workspaceMembers)
            .set({ role: newRole })
            .where(and(
                eq(workspaceMembers.workspaceId, workspaceId),
                eq(workspaceMembers.userId, targetUserId)
            ));

        return { success: true, message: "Role updated successfully" };

    } catch (error) {
        console.error(error);
        return { success: false, message: "An error occurred" };
    }
}