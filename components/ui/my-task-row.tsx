"use client"

import { useState } from "react"
import {
    CheckCircle2,
    Circle,
    Clock,
    Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { UserTypeNew } from "@/types/types"
import { TableCell, TableRow } from "./table"

interface MyTaskRowProps {
    task: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        workspaceId: string;
        title: string;
        description: string | null;
        status: "todo" | "in_review" | "done";
        priority: "low" | "medium" | "high";
        dueDate: string | null;
        assigneeId: string;
        createdBy: string;
    },
    currentUserRole: string | null,
    currentUser: UserTypeNew,
    workspaceId: string,
    onClick: () => void
}

export function MyTaskRow({ task, onClick }: MyTaskRowProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    return (
        <TableRow className="group border-b border-border/40 last:border-0 hover:bg-muted/30 transition-all cursor-default" onClick={onClick}>
            <TableCell className="px-6 py-4 max-w-[300px]">
                <div className="flex items-center gap-3">
                    {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> :
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
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground transition-opacity">
                    <Clock className="h-4 w-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}