"use client"

import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskBadge } from "./task-badge"
import { TasksWithAssignees } from "@/types/types"

interface TaskDetailModalProps {
  task: TasksWithAssignees | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm">{task.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
              <TaskBadge type="status" value={task.status} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Priority</h3>
              <TaskBadge type="priority" value={task.priority} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Assignee</h3>
              <p className="text-sm">{task.user.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
              <p className="text-sm">{formatDistanceToNow(task.createdAt, { addSuffix: true })}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h3>
            <p className="text-sm">{formatDistanceToNow(task.updatedAt, { addSuffix: true })}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
