import { db } from "@/db";
import { workspaceMembers } from "@/db/schema";
import { requireUser } from "@/lib/authguard";
import { eq, and } from "drizzle-orm";

type Role = "admin" | "member" | "owner";

const rolePriority: Record<Role, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export async function requireWorkspaceAccess(
  workspaceId: string,
  minimumRole: Role = "member"
) {
  const user = await requireUser();

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, user.id)
    ),
  });

  if (!membership) {
    throw new Error("No access to this workspace");
  }

  if (rolePriority[membership.role] < rolePriority[minimumRole]) {
    throw new Error("Insufficient permissions");
  }

  return {
    user,
    role: membership.role,
  };
}
