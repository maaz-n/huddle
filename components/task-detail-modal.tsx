"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  Calendar,
  Clock,
  Tag,
  AlignLeft,
  Loader2,
  AlertCircle,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TasksWithAssignees, UserTypeNew } from "@/types/types"
import { addRevisionNote, deleteTask, updateTaskStatus } from "@/actions/tasks"
import { UserAvatar } from "./user-avatar"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Toggle } from "./ui/toggle"
import { Textarea } from "./ui/textarea"
import { Alert } from "./ui/alert"
import { Separator } from "./ui/separator"

type nextStatusType = "todo" | "in_review" | "done"

interface TaskDetailModalProps {
  task: TasksWithAssignees & {
    isOverdue?: boolean
  } | null,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  workspaceId: string,
  currentUser: UserTypeNew,
  currentUserRole: string | null,
}

export function TaskDetailModal({ task, open, onOpenChange, workspaceId, currentUser, currentUserRole }: TaskDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUpdating2, setIsUpdating2] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRequestingChange, setIsRequestingChange] = useState(false)
  const [revisionNote, setRevisionNote] = useState(task?.description ?? "")
  const [taskStatus, setTaskStatus] = useState(task?.status)

  async function updateStatus(taskId: string, nextStatus: nextStatusType) {
    try {
      const response = await updateTaskStatus(taskId, workspaceId, nextStatus)
      if (response.success) {
        toast.success(response.message)
        router.refresh()
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (task) setTaskStatus(task.status)
    setIsRequestingChange(false)
    setRevisionNote("")
  }, [task, open])

  const router = useRouter();

  if (!task) return null


  const currentUserTaskInReview = task.assigneeId === currentUser.id && taskStatus === "in_review"
  const taskCompleted = taskStatus === "done"
  const isManager = currentUserRole === "admin" || currentUserRole === "owner"

  const handleUpdateStatus = async () => {
    if (task.status === "done") return
    setIsUpdating(true)
    const nextStatus = currentUserRole === "member" ? "in_review" : "done"
    setTaskStatus(nextStatus)
    try {
      await updateStatus(task.id, nextStatus)
      onOpenChange(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const sendForRevision = async () => {
    try {
      setIsUpdating2(true)
      await updateTaskStatus(task.id, workspaceId, "todo");
      await addRevisionNote(task.id, workspaceId, revisionNote)
      toast.success("Task sent for revision")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("An error occured")
    } finally {
      setIsUpdating2(false)
    }
  }

  const handleDeleteTask = async () => {
    try {
      setIsDeleting(true)
      const response = await deleteTask(workspaceId, task.id);
      if (response.success) {
        toast.success(response.message)
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-background">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          <div className="flex-1 p-8 space-y-6 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {task.title}
              </DialogTitle>
              {task.isOverdue && (
                <Alert className="mt-3 px-4 py-2 flex items-center gap-2 border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Overdue
                  </span>
                  <span className="text-xs text-red-600/80 dark:text-red-400/80">
                    Past due date
                  </span>
                </Alert>
              )}
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
            {task.revisionNote && (
              <div className="mt-4 p-4 h-auto rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50">
                <div className="flex items-center gap-2 mb-1 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-tight">Changes Requested</span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 italic">
                  "{task.revisionNote}"
                </p>
              </div>
            )}
          </div>


          <div className="w-full md:w-[380px] bg-muted/30 border-l border-border/50 p-6 space-y-6">
            <div className="space-y-5">

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assignee</label>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground italic">
                    <UserAvatar user={task.user} />
                  </div>
                  <span className="text-sm font-medium">{task.user?.name}</span>
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

              {
                (isManager || task.assigneeId === currentUser.id) &&

                <div className="pt-4 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</label>
                  <div className="flex items-center flex-col justify-between gap-2 mt-1">
                    <Button disabled={isRequestingChange || isUpdating || taskCompleted || currentUserTaskInReview} onClick={handleUpdateStatus} className="w-full">
                      {isUpdating ?
                        <Loader2 className="h-2 w-2 animate-spin" />
                        :
                        taskStatus === "done" ? "Completed" :
                          taskStatus === "in_review" && task.assigneeId === currentUser.id ? "Awaiting approval" :
                            currentUserRole === "member" && task.assigneeId === currentUser.id ?
                              "Send for review"
                              :
                              "Mark as completed"
                      }
                    </Button>
                    {
                      currentUserRole !== "member" && taskStatus === "in_review" &&
                      <Toggle onPressedChange={setIsRequestingChange} pressed={isRequestingChange} className="px-5 w-full" variant={"outline"}>Request changes</Toggle>
                    }
                  </div>
                  {isRequestingChange &&
                    <form onSubmit={sendForRevision}>

                      <div className="space-y-3">
                        <Textarea
                          placeholder="Note..."
                          required
                          className="resize-none min-h-[100px]"
                          onChange={(e) => setRevisionNote(e.target.value)}
                        />
                        <Button className="w-full" type="submit" disabled={isUpdating2} >
                          {isUpdating2 ?
                            <Loader2 className="h-2 w-2 animate-spin" />
                            :
                            "Send for revision"
                          }
                        </Button>

                      </div>
                    </form>}
                  {currentUserRole !== "member" &&
                    <>
                      <Separator className="my-5" />
                      <Button variant={"destructive"} className="w-full" disabled={isRequestingChange || isDeleting} onClick={handleDeleteTask}>
                        {isDeleting ?
                          <Loader2 className="h-2 w-2 animate-spin" />
                          :
                          "Delete Task"
                        }
                      </Button>
                    </>
                  }
                </div>
              }

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}