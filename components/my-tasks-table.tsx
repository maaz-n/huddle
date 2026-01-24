"use client"

import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MoreVertical, 
  Calendar as CalendarIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  status: "todo" | "in_progress" | "blocked" | "done"
  priority: "high" | "medium" | "low"
  dueDate: string | null
  workspaceId: string
}

export function MyTasksTable({ tasks }: { tasks: Task[] }) {
  return (
    <div className="w-full space-y-4 mt-10">
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Task</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 hidden md:table-cell">Workspace</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Due Date</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {tasks.map((task) => (
              <tr key={task.id} className="group hover:bg-muted/30 transition-all cursor-pointer">
                
                <td className={cn(
                  "px-6 py-4 border-l-4",
                  task.priority === "high" ? "border-red-500" : 
                  task.priority === "medium" ? "border-amber-500" : "border-blue-500"
                )}>
                  <div className="flex items-center gap-3">
                    <button className="text-muted-foreground hover:text-primary transition-colors">
                      {task.status === "done" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-sm font-semibold tracking-tight",
                        task.status === "done" && "line-through text-muted-foreground font-normal"
                      )}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 md:hidden">
                         <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">{task.priority}</Badge>
                         <span className="text-[10px] text-muted-foreground">{task.workspaceId}</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="text-xs font-medium text-muted-foreground/80 bg-muted px-2 py-1 rounded">
                    {task.workspaceId}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Clock className={cn(
                        "h-3.5 w-3.5",
                        task.priority === "high" ? "text-red-500" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                        "text-xs font-medium",
                        task.priority === "high" && "text-red-600 font-bold"
                    )}>
                      Today, 5:00 PM
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}