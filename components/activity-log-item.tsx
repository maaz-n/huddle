"use client"

import { formatDistanceToNow } from "date-fns"
import { UserAvatar } from "./user-avatar"
import { ActivityItem } from "@/types/types"

type LogProps = ActivityItem

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

    case "TASK_LABELS_UPDATED":
      return (
        <span className="text-muted-foreground ml-1">
          updated the labels on <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "TASK_ATTACHMENT_ADDED":
      return (
        <span className="text-muted-foreground ml-1">
          attached <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "TASK_ATTACHMENT_REMOVED":
      return (
        <span className="text-muted-foreground ml-1">
          removed the attachment <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "TASK_RECURRENCE_CREATED":
      return (
        <span className="text-muted-foreground ml-1">
          scheduled the next occurrence of{" "}
          <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "SUBTASK_ADDED":
      return (
        <span className="text-muted-foreground ml-1">
          added subtask <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "SUBTASK_COMPLETED":
      return (
        <span className="text-muted-foreground ml-1">
          completed subtask <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "SUBTASK_REOPENED":
      return (
        <span className="text-muted-foreground ml-1">
          reopened subtask <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "SUBTASK_DELETED":
      return (
        <span className="text-muted-foreground ml-1">
          deleted subtask <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
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

    case "WORKSPACE_CREATED":
      return (
        <span className="text-muted-foreground ml-1">
          created the workspace <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "WORKSPACE_RENAMED":
      return (
        <span className="text-muted-foreground ml-1">
          renamed the workspace to <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "MEMBER_ADDED":
      return (
        <span className="text-muted-foreground ml-1">
          added <span className="font-medium text-foreground">{log.metadata?.entityName}</span> as{" "}
          <span className="font-medium text-foreground">{log.metadata?.role}</span>
        </span>
      );

    case "MEMBER_REMOVED":
      return (
        <span className="text-muted-foreground ml-1">
          removed <span className="font-medium text-foreground">{log.metadata?.entityName}</span> from the workspace
        </span>
      );

    case "MEMBER_ROLE_CHANGED":
      return (
        <span className="text-muted-foreground ml-1">
          changed <span className="font-medium text-foreground">{log.metadata?.entityName}</span>&apos;s role to{" "}
          <span className="font-medium text-foreground">{log.metadata?.role}</span>
        </span>
      );

    case "OWNERSHIP_TRANSFERRED":
      return (
        <span className="text-muted-foreground ml-1">
          transferred ownership to <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
        </span>
      );

    case "INVITATION_SENT":
      return (
        <span className="text-muted-foreground ml-1">
          invited <span className="font-medium text-foreground">{log.metadata?.entityName}</span> as{" "}
          <span className="font-medium text-foreground">{log.metadata?.role}</span>
        </span>
      );

    case "INVITATION_ACCEPTED":
      return (
        <span className="text-muted-foreground ml-1">
          accepted the invitation and joined the workspace
        </span>
      );

    case "INVITATION_REVOKED":
      return (
        <span className="text-muted-foreground ml-1">
          revoked the invitation for <span className="font-medium text-foreground">{log.metadata?.entityName}</span>
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