"use server"

import { db } from "@/db"
import { user, workspaceMembers, workspaces } from "@/db/schema"
import { getCurrentUser } from "./auth"
import { eq } from "drizzle-orm"

export const createWorkspace = async (name: string) => {
    try {
        const user = await getCurrentUser();
        if (!user) throw ("User not logged in!")
        const workspace = await db.insert(workspaces).values({ name: name, ownerId: user.id }).returning();
        await db.insert(workspaceMembers).values({ workspaceId: workspace[0].id, userId: user.id, role: "admin" })
        return { success: true, message: "Workspace created!" }
    } catch (error) {
        console.error(error)
        return { success: false, message: "There was an error creating the workspace" }
    }
}

export const getWorkspaces = async () => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];
  const workspaces = db.query.workspaces.findMany({
    where: (workspaces, { eq }) => eq(workspaces.ownerId, currentUser.id)
  })

  return workspaces
}

export const getWorkspaceUsers = async (workspaceId: string) => {
    return await db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: workspaceMembers.role
    })
        .from(user)
        .innerJoin(workspaceMembers, eq(workspaceMembers.userId, user.id))
        .where(eq(workspaceMembers.workspaceId, workspaceId))
}