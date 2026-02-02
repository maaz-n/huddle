import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TaskRow } from "./task-row"
import { TasksWithAssignees } from "@/types/types"



export function TaskTable({ tasksWithAssignees, onTaskSelect }: { tasksWithAssignees: TasksWithAssignees[], onTaskSelect: (task: TasksWithAssignees) => void }) {
  if (tasksWithAssignees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tasks found. Create one to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm mt-10">
      <Table className="w-full text-left border-collapse">
        <TableHeader>
          <TableRow className="border-b border-border/50 bg-muted/10">
            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Title</TableHead>
            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Assignee</TableHead>
            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</TableHead>
            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Priority</TableHead>
            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Due Date</TableHead>
            <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasksWithAssignees.map((task) => (
            <TaskRow key={task.id} task={task} onClick={() => onTaskSelect(task)}/>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
