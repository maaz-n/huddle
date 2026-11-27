"use server"

import { db } from "@/db";
import { user, workspaceMembers } from "@/db/schema";
import { auth } from "@/lib/auth"
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
  emailSchema,
  passwordSchema,
  tokenSchema,
  validationMessage,
} from "@/lib/validation";

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
        console.error(error)
        return { success: false, message: "Could not log in" }
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
        emailNotifications: user.emailNotifications,
    })
    .from(user)
    .where(eq(user.id, userId));

    return realUser[0]

    } catch {
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

export const requestPasswordReset = async (email: string) => {
  try {
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      return { success: false, message: validationMessage(parsedEmail.error) };
    }

    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    await auth.api.requestPasswordReset({
      body: {
        email: parsedEmail.data.toLowerCase(),
        redirectTo: `${baseUrl}/reset-password`,
      },
    });

    return {
      success: true,
      message: "If that email is registered, check your inbox for a reset link.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not request a password reset" };
  }
}

export const resendVerificationEmail = async (email: string) => {
  try {
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      return { success: false, message: validationMessage(parsedEmail.error) };
    }

    await auth.api.sendVerificationEmail({
      body: { email: parsedEmail.data.toLowerCase() },
    });

    return {
      success: true,
      message: "If that email needs verification, check your inbox.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not send a verification email" };
  }
}

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const parsedToken = tokenSchema.safeParse(token);
    const parsedPassword = passwordSchema.safeParse(newPassword);

    if (!parsedToken.success) {
      return { success: false, message: validationMessage(parsedToken.error) };
    }
    if (!parsedPassword.success) {
      return { success: false, message: validationMessage(parsedPassword.error) };
    }

    await auth.api.resetPassword({
      body: {
        token: parsedToken.data,
        newPassword: parsedPassword.data,
      },
    });

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "This reset link is invalid or expired" };
  }
}


