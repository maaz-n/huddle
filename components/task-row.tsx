"use client"

import { formatDistanceToNow } from "date-fns"
import { TableCell, TableRow } from "@/components/ui/table"
import { TaskBadge } from "./task-badge"
import { UserAvatar } from "./user-avatar"
import { TasksWithAssignees } from "@/types/types"
import { cn } from "@/lib/utils"

interface TaskRowProps {
  task: TasksWithAssignees & {
    isOverdue?: boolean
  }
  onClick: () => void
}

export function TaskRow({ task, onClick }: TaskRowProps) {
  const isOverdue = task.isOverdue

  return (
    <TableRow
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-colors",
        "hover:bg-secondary",
        isOverdue && [
          "bg-red-50 hover:bg-red-100 border-l-4 border-red-500",
          "dark:bg-red-950/30 dark:hover:bg-red-950/40 dark:border-red-600",
        ]
      )}
    >
      <TableCell className="font-medium max-w-xs truncate px-6 py-4">
        {task.title}
      </TableCell>

      <TableCell className="px-6 py-4">
        <UserAvatar user={task.user} className="h-6 w-6" />
      </TableCell>

      <TableCell className="px-6 py-4">
        <TaskBadge type="status" value={task.status} />
      </TableCell>

      <TableCell className="px-6 py-4">
        <TaskBadge type="priority" value={task.priority} />
      </TableCell>

      <TableCell
        className={cn(
          "text-sm px-6 py-4",
          isOverdue
            ? "text-red-600 dark:text-red-400 font-medium"
            : "text-muted-foreground"
        )}
      >
        {task.dueDate?.split("T")[0]}
      </TableCell>

      <TableCell className="text-sm text-muted-foreground px-6 py-4">
        {formatDistanceToNow(task.updatedAt, { addSuffix: true })}
      </TableCell>
    </TableRow>
  )
}
