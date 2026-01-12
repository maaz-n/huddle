"use server"

import { db } from "@/db";
import { user } from "@/db/schema";
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