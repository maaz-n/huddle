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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Updated</TableHead>
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
