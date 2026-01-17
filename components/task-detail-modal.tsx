"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Calendar,
  Clock,
  Tag,
  AlignLeft,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Save,
  LockIcon
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
import { Button } from "@/components/ui/button"
import { TasksWithAssignees, UserTypeNew } from "@/types/types"
import { updateTaskStatus } from "@/actions/tasks"
import { UserAvatar } from "./user-avatar"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TaskDetailModalProps {
  task: TasksWithAssignees | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  workspaceId: string
  currentUser: UserTypeNew,
  currentUserRole: string | null
}

const statusConfig = {
  "todo": { label: "To Do", icon: Circle, color: "text-slate-500" },
  "in_progress": { label: "In Progress", icon: Loader2, color: "text-blue-500" },
  "blocked": { label: "Blocked", icon: AlertCircle, color: "text-destructive" },
  "done": { label: "Done", icon: CheckCircle2, color: "text-green-500" },
}

type TaskStatusType = "todo" | "in_progress" | "blocked" | "done"

export function TaskDetailModal({ task, open, onOpenChange, workspaceId, currentUser, currentUserRole }: TaskDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatusType>(task?.status ?? "todo")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (task) setSelectedStatus(task.status)
  }, [task, open])

  const router = useRouter();

  if (!task) return null

  const hasChanges = selectedStatus !== task.status
  const canUserUpdate = task.user.id === currentUser.id || currentUserRole !== "member";

  const handleUpdateStatus = async () => {
    setIsUpdating(true)
    try {
      const response = await updateTaskStatus(task.id, workspaceId, selectedStatus)
      if (response.success) {
        toast.success(response.message);
        router.refresh()
      } else {
        toast.error(response.message)
      }

    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl bg-background">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">

          <div className="flex-1 p-8 space-y-6 overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-[10px] uppercase font-bold px-2 py-0">
                  ID-{task.workspaceId.slice(0, 4)}
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {task.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <AlignLeft className="h-4 w-4" />
                Description
              </div>
              <p className="text-sm leading-relaxed text-foreground/80 bg-muted/20 p-4 rounded-xl border border-border/40">
                {task.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="w-full md:w-[280px] bg-muted/30 border-l border-border/50 p-6 space-y-6">
            <div className="space-y-5">

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                <div className="space-y-2">
                  <Select 
                  value={selectedStatus} 
                  onValueChange={(value) => setSelectedStatus(value as TaskStatusType)}
                  disabled={!canUserUpdate}
                   >
                    <SelectTrigger className="w-full bg-background ring-offset-background focus:ring-1 focus:ring-primary">
                      {!canUserUpdate ? 
                      <div className="flex items-center gap-3">
                        <LockIcon/>
                        <SelectValue />
                      </div>
                      : 
                      <SelectValue />
                      }
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                            <span className="text-sm">{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasChanges && (
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={isUpdating}
                      size="sm"
                      className="w-full h-9 transition-all animate-in fade-in zoom-in-95 duration-200"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Update Status
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Assignee */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assignee</label>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground italic">
                    <UserAvatar user={task.user} />
                  </div>
                  <span className="text-sm font-medium">{task.user.name}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm capitalize font-medium">{task.priority}</span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Added {formatDistanceToNow(task.createdAt, { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Modified {formatDistanceToNow(task.updatedAt, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}