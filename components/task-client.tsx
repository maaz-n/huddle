"use client"

import { InsertTask, TasksWithAssignees, UserTypeNew, WorkspaceUser } from '@/types/types'
import { FilterBar } from './filter-bar'
import { TaskTable } from './task-table'
import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from './ui/button'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { TaskDetailModal } from './task-detail-modal'
import { TaskCreateModal } from './task-create-modal'
import { createTask } from '@/actions/tasks'
import { toast } from 'sonner'
import { WorkspaceCreateModal } from './workspace-create-modal'
import { createWorkspace } from '@/actions/workspace'
import { isOverdue } from '@/lib/utils'

interface TaskClientProps {
    users: UserTypeNew[]
    tasksWithAssignees: TasksWithAssignees[]
    workspaceUsers: WorkspaceUser[],
    workspaceId: string
    currentUser: UserTypeNew,
    currentUserRole: string | null,
    total: number,
    page: number,
    pageSize: number
}

const TaskClient = ({ users, tasksWithAssignees, workspaceUsers, workspaceId, currentUser, currentUserRole, total, page, pageSize }: TaskClientProps) => {

    const [selectedTask, setSelectedTask] = useState<(typeof tasksWithAssignees)[0] | null>(null);
    const [taskDetailOpen, setTaskDetailOpen] = useState(false);
    const [taskCreateOpen, setTaskCreateOpen] = useState(false);

    const tasksWithDueInfo = tasksWithAssignees.map(task => ({
        ...task,
        isOverdue: isOverdue(task)
    }))

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const goToPage = (next: number) => {
        const params = new URLSearchParams(searchParams.toString())
        if (next <= 1) params.delete("page")
        else params.set("page", String(next))
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const handleCreateTask = async (data: InsertTask) => {
        try {
            const { workspaceId, title, description, status, priority, assigneeId, dueDate } = data;
            const response = await createTask(workspaceId, title, description, status, priority, assigneeId, dueDate);

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
        <div className="py-8 px-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tasks</h1>
                    <p className="text-muted-foreground mt-2">Manage all your tasks in one place</p>
                </div>
                {currentUserRole !== "member" &&
                    <Button onClick={() => setTaskCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 hidden sm:inline-flex">
                        <Plus className="h-4 w-4" />
                        New Task
                    </Button>
                }
            </div>
            {currentUserRole !== "member" &&
                    <Button onClick={() => setTaskCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 sm:hidden">
                        <Plus className="h-4 w-4" />
                        New Task
                    </Button>
                }

            <FilterBar users={users} />

            <TaskTable
                onTaskSelect={(task: TasksWithAssignees) => {
                    setSelectedTask(task);
                    setTaskDetailOpen(true)
                }}
                tasksWithAssignees={tasksWithDueInfo}
                emptyMessage={total > 0 ? "No tasks match these filters." : undefined} />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-sm text-muted-foreground">
                    {total} task{total === 1 ? "" : "s"} &middot; Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => goToPage(page - 1)}
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => goToPage(page + 1)}
                    >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </div>

            <TaskDetailModal
                task={selectedTask}
                open={taskDetailOpen}
                onOpenChange={setTaskDetailOpen}
                workspaceId={workspaceId}
                currentUser={currentUser}
                currentUserRole={currentUserRole}
            />
            <TaskCreateModal open={taskCreateOpen} onOpenChange={setTaskCreateOpen} onCreateTask={handleCreateTask} workspaceId={workspaceId} workspaceUsers={workspaceUsers} />
        </div>
    )
}

export default TaskClient