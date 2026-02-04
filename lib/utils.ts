import { TasksWithAssignees } from "@/types/types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isOverdue(task: TasksWithAssignees): boolean {
  if (task.status === "done") return false

  if (!task.dueDate) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(task.dueDate)
  due.setHours(0, 0, 0, 0)

  return due < today
}
