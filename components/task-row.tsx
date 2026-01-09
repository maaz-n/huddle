"use client"

import { formatDistanceToNow } from "date-fns"
import { TableCell, TableRow } from "@/components/ui/table"
import { TaskBadge } from "./task-badge"
import { UserAvatar } from "./user-avatar"
import { TasksWithAssignees } from "@/types/types"

interface TaskRowProps {
  task: TasksWithAssignees
  onClick: () => void
}

export function TaskRow({ task, onClick }: TaskRowProps) {

  return (
    <TableRow className="cursor-pointer hover:bg-secondary transition-colors" onClick={onClick}>
      <TableCell className="font-medium max-w-xs truncate">{task.title}</TableCell>
      <TableCell>
        <UserAvatar user={task.user} className="h-6 w-6" />
      </TableCell>
      <TableCell>
        <TaskBadge type="status" value={task.status} />
      </TableCell>
      <TableCell>
        <TaskBadge type="priority" value={task.priority} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(task.updatedAt, { addSuffix: true })}
      </TableCell>
    </TableRow>
  )
}
