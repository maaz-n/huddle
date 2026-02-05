import { TasksWithAssignees } from "@/types/types"
import { clsx, type ClassValue } from "clsx"
import { format, isThisYear, isToday, isTomorrow } from "date-fns"
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


export function formatDueDate(dueDate: string) {
    const date = new Date(dueDate)
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"

    return isThisYear(date)
        ? format(date, "MMM d")
        : format(date, "MMM d, yyyy")
}
