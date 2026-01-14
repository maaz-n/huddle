"use server"

import { db } from "@/db";
import { user, workspaceMembers } from "@/db/schema";
import { auth } from "@/lib/auth"
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

export const login = async (email: string, password: string) => {
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password
            },
        });

        return { success: true, message: "Login successfull!" }
    } catch (error) {
        const e = error as Error
        return { success: false, message: e.message }
    }
}

export const signup = async (name: string, email: string, password: string) => {
    try {
        await auth.api.signUpEmail({
            body: {
                name, email, password,
            }
        })

        return { success: true, message: "Account created!" }
    } catch (error) {
        const e = error as Error
        return { success: false, message: e.message }
    }
}

export const getCurrentUser = async () => {
    try {
        const session = await auth.api.getSession({
        headers: await headers(),
    });

    if(!session) return;
    const userId = session.user.id;

    const realUser = await db.select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
    })
    .from(user)
    .where(eq(user.id, userId));

    return realUser[0]

    } catch (error) {
        throw new Error("Could not fetch user!");    
    }
    
}

export const getUserWorkspaceRole = async (workspaceId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser) return null

  const result = await db
    .select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, currentUser.id),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    )

  return result[0]?.role ?? null
}


