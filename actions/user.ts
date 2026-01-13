"use server"

import { db } from "@/db";
import { user, workspaceMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateUser(newName: string, email: string){
    try {
        await db.update(user)
        .set({name: newName})
        .where(eq(user.email, email))

        return { success: true, message: "Name updated!" }
    } catch (error) {
        console.error(error);
        return { success: false, message: "An error occured!" }
    }
}

export async function getUserByEmail(email: string){
    try {
        const userObj =  await db.select({id: user.id})
        .from(user)
        .where(eq(user.email, email))

        return userObj[0]
    } catch (error) {
      console.error(error)  
    } 
}

export async function addMember(workspaceId: string, role: string, email: string){
    const user = await getUserByEmail(email);

    if(!user || !user.id) return { success: false, message: `User of email ${email} not found!` }

    try {
        await db.insert(workspaceMembers).values({
            userId: user.id,
            workspaceId: workspaceId,
            role: role as "admin" | "owner" | "member"
        })

        return { success: true, message: "User added to workspace" }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Could not add user to workspace" }

    }
}