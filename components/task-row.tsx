"use client"

import { formatDistanceToNow } from "date-fns"
import { TableCell, TableRow } from "@/components/ui/table"
import { TaskBadge } from "./task-badge"
import { UserAvatar } from "./user-avatar"

interface Task {
  id: string
  title: string
  assignee: {
    name: string
    image?: string
  }
  status: "todo" | "in_progress" | "blocked" | "done"
  priority: "low" | "medium" | "high"
  updatedAt: Date
}

interface TaskRowProps {
  task: Task
  onClick: () => void
}

export function TaskRow({ task, onClick }: TaskRowProps) {
  return (
    <TableRow onClick={onClick} className="cursor-pointer hover:bg-secondary transition-colors">
      <TableCell className="font-medium max-w-xs truncate">{task.title}</TableCell>
      <TableCell>
        <UserAvatar user={task.assignee} className="h-6 w-6" />
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
