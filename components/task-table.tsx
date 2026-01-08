"use client"

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TaskRow } from "./task-row"

interface Task {
  id: string
  title: string
  assignee: {
    name: string
    image?: string
  }
  status: "todo" | "in_progress" | "blocked" | "done"
  priority: "low" | "medium" | "high"
  updatedAt: Date
}

interface TaskTableProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  if (tasks.length === 0) {
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
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
