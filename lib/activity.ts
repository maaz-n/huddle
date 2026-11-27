import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export async function logActivity(params: {
  workspaceId: string;
  actorId: string;
  entityType: "task" | "workspace";
  entityId: string;
  action: string;
  metadata: {
    entityName?: string;
    oldName?: string;
    oldStatus?: string;
    newStatus?: string;
    note?: string;
    comment?: string;
    role?: string;
    oldRole?: string;
    email?: string;
    assigneeId?: string;
    assigneeName?: string;
  }
}) {
  // Activity is an audit trail, not part of the mutation. A failed insert must
  // never turn a successful update into an error response.
  try {
    await db.insert(activityLogs).values({
      workspaceId: params.workspaceId,
      actorId: params.actorId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      metadata: params.metadata
    });
  } catch (error) {
    console.error("[activity] Could not record activity:", error);
  }
}
