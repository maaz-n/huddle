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
      <TableCell className="font-medium max-w-xs truncate px-6 py-4">{task.title}</TableCell>
      <TableCell className="px-6 py-4">
        <UserAvatar user={task.user} className="h-6 w-6" />
      </TableCell>
      <TableCell className="px-6 py-4">
        <TaskBadge type="status" value={task.status} />
      </TableCell>
      <TableCell className="px-6 py-4">
        <TaskBadge type="priority" value={task.priority} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground px-6 py-4">
        {task.dueDate?.split("T")[0]}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground px-6 py-4">
        {formatDistanceToNow(task.updatedAt, { addSuffix: true })}
      </TableCell>
    </TableRow>
  )
}
