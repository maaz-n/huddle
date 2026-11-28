"use server";

import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { seedDemoData } from "@/lib/demo-seed";
import { auth } from "@/lib/auth";
import { getCurrentUser } from "./auth";

export async function demoLogin() {
  try {
    const { workspaceId } = await seedDemoData();

    await auth.api.signInEmail({
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });

    return {
      success: true,
      message: "Welcome to the demo!",
      workspaceId,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Demo is not available right now" };
  }
}

export async function resetDemo() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.isDemo) {
      return { success: false, message: "Demo mode is not active" };
    }

    const { workspaceId } = await seedDemoData({ reset: true });
    return { success: true, message: "Demo data reset", workspaceId };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not reset the demo" };
  }
}
