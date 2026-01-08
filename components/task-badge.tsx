"use client"

import { Badge } from "@/components/ui/badge"

type TaskStatus = "todo" | "in_progress" | "blocked" | "done"
type TaskPriority = "low" | "medium" | "high"

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: "To Do", className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" },
  blocked: { label: "Blocked", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" },
  done: { label: "Done", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
  high: { label: "High", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100" },
}

interface TaskBadgeProps {
  type: "status" | "priority"
  value: TaskStatus | TaskPriority
}

export function TaskBadge({ type, value }: TaskBadgeProps) {
  const config = type === "status" ? statusConfig[value as TaskStatus] : priorityConfig[value as TaskPriority]

  return <Badge className={config.className}>{config.label}</Badge>
}
