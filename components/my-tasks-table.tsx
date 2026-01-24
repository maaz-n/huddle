"use client"

import { updateTaskStatus } from "@/actions/tasks"
import { MyTaskRow } from "./ui/my-task-row"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/actions/auth"

type nextStatusType = "todo" | "in_review" | "done"

interface MyTasksTableProps {
  tasks: {
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
  }[],
  currentUserRole: string | null,
  workspaceId: string
}

export function MyTasksTable({ tasks, currentUserRole, workspaceId }: MyTasksTableProps) {
  const router = useRouter()

  async function updateStatus(taskId: string, nextStatus: nextStatusType) {
    try {
      const user = await getCurrentUser()
      console.log(taskId, workspaceId, nextStatus, user?.name)
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
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm mt-10">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border/50 bg-muted/10">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Task Name</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Priority</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task: any) => (
            <MyTaskRow
              key={task.id}
              task={task}
              currentUserRole={currentUserRole}
              onStatusUpdate={updateStatus}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}