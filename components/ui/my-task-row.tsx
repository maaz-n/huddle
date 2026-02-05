"use client"

import {
    CheckCircle2,
    Circle,
    Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TasksWithAssignees, UserTypeNew } from "@/types/types"
import { TableCell, TableRow } from "./table"
import { format, isThisYear, isToday, isTomorrow } from "date-fns"

interface MyTaskRowProps {
    task: TasksWithAssignees & {
        isOverdue?: boolean
    },
    currentUserRole: string | null,
    currentUser: UserTypeNew,
    workspaceId: string,
    onClick: () => void
}

function formatDueDate(dueDate: string) {
    const date = new Date(dueDate)
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"

    return isThisYear(date)
        ? format(date, "MMM d")
        : format(date, "MMM d, yyyy")
}

export function MyTaskRow({ task, onClick }: MyTaskRowProps) {

    return (
        <TableRow className={cn("group border-b border-border/40 last:border-0 hover:bg-muted/30 transition-all cursor-default", task.isOverdue && [
            "bg-red-50 hover:bg-red-100 border-l-4 border-red-500",
            "dark:bg-red-950/30 dark:hover:bg-red-950/40 dark:border-red-600",
        ])} onClick={onClick}>
            <TableCell className="px-6 py-4 max-w-[300px]">
                <div className="flex items-center gap-3">
                    {
                        task.status === "in_review" ? <Clock className="h-5 w-5 text-amber-500" /> :
                            task.status === "done" ? <CheckCircle2 className="h-5 w-5 text-green-500" /> :
                                <Circle className="h-5 w-5" />}
                    <span className={cn(
                        "text-sm font-semibold truncate",
                        (task.status === "done" || task.status === "in_review") && "text-muted-foreground font-normal line-through opacity-70"
                    )}>
                        {task.title}
                    </span>
                </div>
            </TableCell>

            <TableCell className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[11px] font-bold uppercase tracking-tighter",
                        task.priority === "high" ? "text-red-500" :
                            task.priority === "medium" ? "text-amber-500" : "text-blue-500"
                    )}>
                        {task.priority}
                    </span>
                </div>
            </TableCell>

            <TableCell className="px-6 py-4">
                <Badge
                    variant="outline"
                    className={cn(
                        "text-[10px] px-2 py-0 border-none bg-muted/50",
                        task.status === "in_review" && "bg-amber-100 text-amber-700",
                        task.status === "done" && "bg-green-100 text-green-700",
                        task.status === "in_review" && "bg-blue-100 text-blue-700"
                    )}
                >
                    {task.status === "in_review" ? "IN REVIEW" : task.status.toUpperCase()}
                </Badge>
            </TableCell>

            <TableCell className="px-6 py-4 text-center">
                <span className="flex items-center text-sm gap-2 text-muted-foreground transition-opacity">
                    <Clock className="h-4 w-4" />
                    <span>{formatDueDate(task.dueDate)}</span>
                </span>
            </TableCell>
        </TableRow>
    )
}