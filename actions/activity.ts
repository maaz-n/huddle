import { db } from "@/db";

export async function getRecentActivity(workspaceId: string) {
    const logs = await db.query.activityLogs.findMany({
        where: (activityLogs, { eq }) => eq(activityLogs.workspaceId, workspaceId),
        orderBy: (activityLogs, { desc }) => desc(activityLogs.createdAt),
        limit: 5
    })

    const userIds = [...new Set(logs.map(l => l.actorId))]

    const users = await db.query.user.findMany({
        where: (user, { inArray }) => inArray(user.id, userIds),
    })

    const userMap = Object.fromEntries(
        users.map(u => [u.id, u])
    )

    return logs.map(log => ({
        id: log.id,
        actor: {
            name: userMap[log.actorId]?.name ?? "Unknown",
            image: userMap[log.actorId]?.image,
        },
        action: log.action,
        entityType: log.entityType,
        entityName: log.metadata?.entityName ?? "",
        timestamp: log.createdAt,
    }))
}