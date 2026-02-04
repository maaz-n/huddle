"use client"

import { MyTaskRow } from "./ui/my-task-row"
import { useRouter } from "next/navigation"
import { TasksWithAssignees, UserTypeNew } from "@/types/types"

interface MyTasksTableProps {
  tasks: TasksWithAssignees[],
  currentUserRole: string | null,
  workspaceId: string,
  currentUser: UserTypeNew
  onTaskSelect: (task: TasksWithAssignees) => void
}

export function MyTasksTable({ tasks, currentUserRole, currentUser, workspaceId, onTaskSelect }: MyTasksTableProps) {
  const router = useRouter()

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
          {tasks.length > 0 ?

            tasks.map((task: TasksWithAssignees) => (
              <MyTaskRow
                key={task.id}
                task={task}
                currentUserRole={currentUserRole}
                currentUser={currentUser}
                workspaceId={workspaceId}
                onClick={() => onTaskSelect(task)}

              />
            )) :
            <tr className="text-center">
              <td colSpan={4} className="py-5 text-muted-foreground/70 text-center">
                There are no tasks currently assigned to you.
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  )
}