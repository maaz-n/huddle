"use client"

import { formatDistanceToNow } from "date-fns"
import { UserAvatar } from "./user-avatar"
import { Actor } from "@/types/types"

interface LogProps {
  id: string
  actor: Actor
  action: string
  entityType: string
  entityName: string
  timestamp: Date,
  metadata: {
    entityName?: string
    oldStatus?: string,
    newStatus?: string,
    note?: string,
    comment?: string,
    assigneeId?: string,
    assigneeName?: string,
  } | null
}




function getActivityContent(log: LogProps) {
  const { oldStatus, newStatus } = log.metadata || {};

  // Simple helper to turn "in_progress" into "In Progress"
  const formatStatus = (status: string | undefined) => {
    return status
      ?.replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  switch (log.action) {
    case "TASK_STATUS_CHANGE":
      return (
        <span className="text-muted-foreground ml-1">
          updated task status: <span className="text-foreground font-medium">{formatStatus(oldStatus)}</span>
          <span className="mx-1">→</span>
          <span className="text-foreground font-medium">{formatStatus(newStatus)}</span>
        </span>
      );

    case "TASK_CREATE":
      return <span className="text-muted-foreground ml-1">created task:
      <span className="text-foreground font-medium">{" "} {log.metadata?.entityName}</span>
      </span>;

    case "TASK_ASSIGNED":
      return (
        <span className="text-muted-foreground ml-1">
          assigned <span className="font-medium text-foreground">{log.metadata?.entityName}</span> to{" "}
          <span className="font-medium text-foreground">
            {log.metadata?.assigneeName || "a teammate"}
          </span>
        </span>
      );

    case "TASK_REVISION_REQUESTED":
      return (
        <span className="text-muted-foreground ml-1">
          requested changes on <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
          {log.metadata?.note ? `: "${log.metadata.note}"` : ""}
        </span>
      );

    case "TASK_TITLE_UPDATED":
      return (
        <span className="text-muted-foreground ml-1">
          updated the title of <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "TASK_DESCRIPTION_UPDATED":
      return (
        <span className="text-muted-foreground ml-1">
          updated the description of <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "TASK_COMMENT_ADDED":
      return (
        <span className="text-muted-foreground ml-1">
          commented on <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "TASK_DELETED":
      return (
        <span className="text-muted-foreground ml-1">
          deleted task: <span className="font-medium text-foreground">{log.metadata?.entityName || log.entityName}</span>
        </span>
      );

    default:
      return (
        <span className="text-muted-foreground ml-1">
          {log.action.toLowerCase().replace(/_/g, " ")}
        </span>
      );
  }
}

export function ActivityLogItem({ log }: { log: LogProps }) {
  return (
    <div className="flex gap-3 py-2 items-start">
      <UserAvatar user={log.actor} className="h-6 w-6 mt-0.5 shrink-0" />

      <div className="flex flex-col min-w-0">
        <div className="text-sm leading-snug">
          <span className="font-medium text-foreground">
            {log.actor.name}
          </span>

          {getActivityContent(log)}
        </div>

        <p className="text-[11px] text-muted-foreground/70">
          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}