// import { useState } from "react"
import { Plus } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { TaskTable } from "@/components/task-table"
import { TaskDetailModal } from "@/components/task-detail-modal"
import { TaskCreateModal } from "@/components/task-create-modal"
import { FilterBar } from "@/components/filter-bar"
import { Button } from "@/components/ui/button"
import { getAdminUsers, getTasks } from "@/actions/tasks"

const mockTasks = [
  {
    id: "1",
    title: "Fix login button styling",
    assignee: { name: "John Doe", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
    status: "in_progress" as const,
    priority: "high" as const,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Design homepage redesign",
    assignee: { name: "Jane Smith", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" },
    status: "todo" as const,
    priority: "medium" as const,
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "3",
    title: "API rate limiting",
    assignee: { name: "Bob Johnson", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },
    status: "blocked" as const,
    priority: "high" as const,
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: "4",
    title: "Database migration",
    assignee: { name: "John Doe", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
    status: "done" as const,
    priority: "low" as const,
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    title: "Third-party integration",
    assignee: { name: "Jane Smith", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" },
    status: "in_progress" as const,
    priority: "medium" as const,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
]

export default async function TasksPage(props: any) {
//   const [selectedTask, setSelectedTask] = useState<(typeof mockTasks)[0] | null>(null)
//   const [taskDetailOpen, setTaskDetailOpen] = useState(false)
//   const [taskCreateOpen, setTaskCreateOpen] = useState(false)
//   const [filteredTasks, setFilteredTasks] = useState(mockTasks)

//   const handleTaskClick = (task: (typeof mockTasks)[0]) => {
    // setSelectedTask(task)
    // setTaskDetailOpen(true)
//   }
  const searchParams = await props.searchParams;

  const filter = {
    status: searchParams.status || "",
    priority: searchParams.priority || "",
    assignee: searchParams.assignee || "",
  }

  const filteredTasks = await getTasks(filter);

  const adminUsers = await getAdminUsers();

  const handleCreateTask = (data: any) => {
    console.log("Creating task:", data)
    // In a real app, this would call an API
  }

//   const handleFilterChange = (filters: any) => {
//     let filtered = mockTasks
//     if (filters.status && filters.status.length > 0) {
//       filtered = filtered.filter((t) => filters.status.includes(t.status))
//     }
//     if (filters.priority && filters.priority.length > 0) {
//       filtered = filtered.filter((t) => filters.priority.includes(t.priority))
//     }
//     if (filters.assignee) {
//       filtered = filtered.filter((t) => t.assignee.name.toLowerCase().includes(filters.assignee.toLowerCase()))
//     }
//     setFilteredTasks(filtered)
//   }

  return (
    <AppLayout>
      <div className="py-8 px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground mt-2">Manage all your tasks in one place</p>
          </div>
          {/* <Button onClick={() => setTaskCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Task
          </Button> */}
        </div>

        <FilterBar adminUsers={adminUsers}/>

        <TaskTable tasks={filteredTasks}/>

        {/* Modals */}
        {/* <TaskDetailModal
          task={
            selectedTask
              ? { ...selectedTask, description: "This is a detailed task description.", createdAt: new Date() }
              : null
          }
          open={taskDetailOpen}
          onOpenChange={setTaskDetailOpen}
        /> */}
        {/* <TaskCreateModal open={taskCreateOpen} onOpenChange={setTaskCreateOpen} onCreateTask={handleCreateTask} /> */}
      </div>
    </AppLayout>
  )
}
