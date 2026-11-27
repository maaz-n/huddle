"use client"

import { InsertTask, TasksWithAssignees, UserTypeNew, WorkspaceUser } from '@/types/types'
import { FilterBar } from './filter-bar'
import { TaskTable } from './task-table'
import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from './ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from './ui/alert-dialog'
import { CheckCheck, ChevronLeft, ChevronRight, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { TaskDetailModal } from './task-detail-modal'
import { TaskCreateModal } from './task-create-modal'
import { bulkDeleteTasks, bulkUpdateTaskStatus, createTask } from '@/actions/tasks'
import { toast } from 'sonner'
import { WorkspaceCreateModal } from './workspace-create-modal'
import { createWorkspace } from '@/actions/workspace'
import { isOverdue } from '@/lib/utils'
import { useLocale } from '@/lib/use-locale'

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

    const { t } = useLocale()

    const [selectedTask, setSelectedTask] = useState<(typeof tasksWithAssignees)[0] | null>(null);
    const [taskDetailOpen, setTaskDetailOpen] = useState(false);
    const [taskCreateOpen, setTaskCreateOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);

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

    const toggleSelect = (id: string) => {
        setSelectedIds((previous) =>
            previous.includes(id)
                ? previous.filter((selectedId) => selectedId !== id)
                : [...previous, id],
        )
    }

    const toggleSelectAll = () => {
        const pageIds = tasksWithAssignees.map((task) => task.id)
        const allSelected = pageIds.every((id) => selectedIds.includes(id))
        setSelectedIds(allSelected ? [] : pageIds)
    }

    const handleBulkStatus = async (status: "todo" | "in_review" | "done") => {
        setBulkLoading(true)
        try {
            const response = await bulkUpdateTaskStatus(workspaceId, selectedIds, status)
            if (response.success) {
                toast.success(response.message)
                setSelectedIds([])
                router.refresh()
            } else {
                toast.error(response.message)
            }
        } catch (error) {
            console.error(error)
            toast.error("Could not update the selected tasks")
        } finally {
            setBulkLoading(false)
        }
    }

    const handleBulkDelete = async () => {
        setBulkLoading(true)
        try {
            const response = await bulkDeleteTasks(workspaceId, selectedIds)
            if (response.success) {
                toast.success(response.message)
                setSelectedIds([])
                router.refresh()
            } else {
                toast.error(response.message)
            }
        } catch (error) {
            console.error(error)
            toast.error("Could not delete the selected tasks")
        } finally {
            setBulkLoading(false)
        }
    }

    const handleCreateTask = async (data: InsertTask) => {
        try {
            const { workspaceId, title, description, status, priority, assigneeId, dueDate, recurrence } = data;
            const response = await createTask(workspaceId, title, description, status, priority, assigneeId, dueDate, recurrence);

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
                        {t("tasks.new")}
                    </Button>
                }
            </div>
            {currentUserRole !== "member" &&
                    <Button onClick={() => setTaskCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 sm:hidden">
                        <Plus className="h-4 w-4" />
                        {t("tasks.new")}
                    </Button>
                }

            <FilterBar users={users} />

            {currentUserRole !== "member" && selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                    <span className="text-sm font-medium">
                        {selectedIds.length} selected
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatus("done")}
                        disabled={bulkLoading}
                    >
                        {bulkLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCheck className="mr-2 h-4 w-4" />
                        )}
                        {t("tasks.done")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkStatus("todo")}
                        disabled={bulkLoading}
                    >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t("tasks.reopen")}
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={bulkLoading}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("tasks.delete")}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {t("tasks.delete")} {selectedIds.length} task
                                    {selectedIds.length === 1 ? "" : "s"}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This permanently deletes the selected tasks and their comments.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleBulkDelete}>
                                    {t("tasks.delete")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIds([])}
                        disabled={bulkLoading}
                    >
                        {t("tasks.clear")}
                    </Button>
                </div>
            )}

            <TaskTable
                onTaskSelect={(task: TasksWithAssignees) => {
                    setSelectedTask(task);
                    setTaskDetailOpen(true)
                }}
                tasksWithAssignees={tasksWithDueInfo}
                emptyMessage={total > 0 ? "No tasks match these filters." : undefined}
                selectable={currentUserRole !== "member"}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleAll={toggleSelectAll} />

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