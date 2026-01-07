"use server";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { requireWorkspaceAccess } from "@/lib/workspace-access";

export async function createTask(input: {
  workspaceId: string;
  title: string;
}) {
  const { user } = await requireWorkspaceAccess(
    input.workspaceId,
    "member"
  );

  await db.insert(tasks).values({
    workspaceId: input.workspaceId,
    title: input.title,
    createdBy: user.id,
  });
}
