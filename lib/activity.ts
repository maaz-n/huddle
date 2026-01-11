import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export async function logActivity(params: {
  workspaceId: string;
  actorId: string;
  entityType: "task" | "workspace";
  entityId: string;
  action: string;
  metadata: {
    entityName: string
  }
}) {
  await db.insert(activityLogs).values({
    workspaceId: params.workspaceId,
    actorId: params.actorId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    metadata: params.metadata
  });
}
