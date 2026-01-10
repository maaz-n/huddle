"use server"

import { db } from "@/db"
import { workspaceMembers, workspaces } from "@/db/schema"
import { getCurrentUser } from "./auth"

export const createWorkspace = async (name: string) => {
    try {
        const user = await getCurrentUser();
        if(!user) throw("User not logged in!")
        const workspace = await db.insert(workspaces).values({name: name, ownerId: user.id}).returning();
        await db.insert(workspaceMembers).values({workspaceId: workspace[0].id, userId: user.id, role: "admin"})
        return {success: true, message: "Workspace created!"}
    } catch (error) {
        console.error(error)
        return {success: false, message: "There was an error creating the workspace"}
    }
}