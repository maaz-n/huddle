"use server"

import { db } from "@/db";
import { user, workspaceMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";

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
    const targetUser = await getUserByEmail(email);

    const currentUser = await getCurrentUser();
    if(!currentUser) return { success: false, message: "Unauthorized!" };
    
    
    if(!targetUser || !targetUser.id) return { success: false, message: `User of email ${email} not found!` }

    const currentUserRole = await db.select({role: workspaceMembers.role})
                                .from(workspaceMembers)
                                .where(and(
                                    eq(workspaceMembers.workspaceId, workspaceId),
                                    eq(workspaceMembers.userId, currentUser.id)
                                ))

    if(currentUser.id === targetUser.id) {
        return { success: false, message: "You cannot add yourself" }
    }

    if(currentUserRole[0].role === "admin" && role === "admin") {
        return { success: false, message: "Admins can only add members" }
    }

    try {
        await db.insert(workspaceMembers).values({
            userId: targetUser.id,
            workspaceId: workspaceId,
            role: role as "admin" | "member" | "owner"
        })

        return { success: true, message: "User added to workspace" }
    } catch (error) {
        console.error(error);
        return { success: false, message: "Could not add user to workspace" }

    }
}