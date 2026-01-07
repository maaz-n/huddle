"use server";

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { requireUser } from "@/lib/authguard";

export async function createTask(input: {
  workspaceId: string;
  title: string;
}) {
  const user = await requireUser();

  await db.insert(tasks).values({
    workspaceId: input.workspaceId,
    title: input.title,
    createdBy: user.id,
  });
}
