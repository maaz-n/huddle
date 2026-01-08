"use server"

import { auth } from "@/lib/auth"

export const login = async (email: string, password: string) => {
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password
            },
        });

        return { success: true, message: "Logged in!" }
    } catch (error) {
        const e = error as Error
        return { success: false, message: e.message }
    }
}