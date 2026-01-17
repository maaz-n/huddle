"use client"

import { formatDistanceToNow } from "date-fns"
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  AlignLeft, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  AlertCircle 
} from "lucide-react"

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { TasksWithAssignees } from "@/types/types"

interface TaskDetailModalProps {
  task: TasksWithAssignees | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Map statuses to icons and colors for a professional feel
const statusConfig = {
  todo: { label: "To Do", icon: Circle, color: "text-slate-500" },
  "in progress": { label: "In Progress", icon: Loader2, color: "text-blue-500" },
  blocked: { label: "Blocked", icon: AlertCircle, color: "text-destructive" },
  done: { label: "Done", icon: CheckCircle2, color: "text-green-500" },
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  if (!task) return null

  const handleStatusChange = (newStatus: string) => {
    // Add your update logic / Server Action here
    console.log("Updating status to:", newStatus)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          
          {/* Main Content (Left) */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold">
                  Task-{task.workspaceId.slice(0, 4)}
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-semibold leading-tight tracking-tight">
                {task.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlignLeft className="h-4 w-4" />
                Description
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-lg border border-border/50">
                {task.description || "No description provided for this task."}
              </p>
            </div>
          </div>

          {/* Sidebar Metadata (Right) */}
          <div className="w-full md:w-[260px] bg-muted/30 border-l border-border p-6 space-y-6">
            <div className="space-y-4">
              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
                <Select defaultValue={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full bg-background border-border hover:bg-accent transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={`h-4 w-4 ${config.color}`} />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border/50" />

              {/* Assignee Section */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Assignee</label>
                <div className="flex items-center gap-3 group cursor-default">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-colors group-hover:bg-primary/20">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-none">{task.user.name}</span>
                    <span className="text-[10px] text-muted-foreground">Assignee</span>
                  </div>
                </div>
              </div>

              {/* Priority Section */}
              <div className="space-y-3 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Priority</label>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize font-medium">{task.priority}</span>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="space-y-4 pt-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</label>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Created {formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Updated {formatDistanceToNow(task.updatedAt, { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}