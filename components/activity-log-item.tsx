"use client"

import { formatDistanceToNow } from "date-fns"
import { UserAvatar } from "./user-avatar"

interface ActivityLogItemProps {
  id: string
  actor: {
    name: string
    image?: string
  }
  action: string
  entityType: string
  entityName: string
  timestamp: Date
}

export function ActivityLogItem({ actor, action, entityType, entityName, timestamp }: ActivityLogItemProps) {
  return (
    <div className="flex gap-3 py-3">
      <UserAvatar user={actor} className="h-8 w-8" />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-medium">{actor.name}</span> <span className="text-muted-foreground">{action}</span>{" "}
          <span className="font-medium">{entityName}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(timestamp, { addSuffix: true })}</p>
      </div>
    </div>
  )
}
