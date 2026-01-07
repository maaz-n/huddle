import { auth } from "@/lib/auth"; // adjust import to your setup
import { headers } from "next/headers";

export async function requireUser() {
  const session = await auth.api.getSession({headers: await headers()});

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return {
    id: session.user.id,
    email: session.user.email,
  };
}
