"use server"

import { db } from "@/db"
import { workspaces } from "@/db/schema"
import { getCurrentUser } from "./auth"

export const createWorkspace = async (name: string) => {
    try {
        const user = await getCurrentUser();
        if(!user) throw("User not logged in!")
        await db.insert(workspaces).values({name: name, ownerId: user.id});
        return {success: true, message: "Workspace crated!"}
    } catch (error) {
        console.error(error)
        return {success: false, message: "There was an error creating the workspace"}
    }
}