"use client"

import { formatDistanceToNow } from "date-fns"
import { UserAvatar } from "./user-avatar"
import { Actor } from "@/types/types"

interface ActivityLogItemProps {
  id: string
  actor: Actor
  action: string
  entityType: string
  entityName: string
  timestamp: Date
}

function getActivityText(action: string) {
  switch (action) {
    case "Task created":
      return ' created a task: '
    case "Task assigned":
      return ' was assigned a task: '
    case "Status updated":
      return ' moved a task: '
    default:
      return " did something"
  }
}

export function ActivityLogItem({ actor, action, entityType, entityName, timestamp }: ActivityLogItemProps) {
  return (
    <div className="flex gap-3 py-3">
      <UserAvatar user={actor} className="h-8 w-8" />
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-medium">{actor.name}</span><span className="text-muted-foreground">{getActivityText(action)}</span>{" "}
          <span className="font-medium">{entityName}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(timestamp, { addSuffix: true })}</p>
      </div>
    </div>
  )
}
