import { auth } from "@/lib/auth"; // adjust import to your setup

export async function requireUser() {
  const session = await auth.api.getSession();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return {
    id: session.user.id,
    email: session.user.email,
  };
}
