"use server"

import { auth } from "@/lib/auth"
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
                name, email, password
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

    return session?.user

    } catch (error) {
        throw new Error("Could not fetch user!");    
    }
    
}

