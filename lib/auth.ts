import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { nextCookies } from "better-auth/next-js";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, verificationEmail } from "@/lib/email-templates";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
        enabled: true,
        // New accounts must confirm their address before signing in. Existing
        // accounts were grandfathered in by migration 0013.
        requireEmailVerification: true,
        resetPasswordTokenExpiresIn: 3600,
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: "Reset your Huddle password",
                html: passwordResetEmail(url),
            });
        }
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: "Verify your Huddle email",
                html: verificationEmail(url),
            });
        }
    },
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },

    plugins: [nextCookies()]
});