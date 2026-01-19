"use client"

import { InsertTask, TasksWithAssignees, UserTypeNew, WorkspaceUser } from '@/types/types'
import { FilterBar } from './filter-bar'
import { TaskTable } from './task-table'
import { useState } from 'react'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import { TaskDetailModal } from './task-detail-modal'
import { TaskCreateModal } from './task-create-modal'
import { createTask } from '@/actions/tasks'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { WorkspaceCreateModal } from './workspace-create-modal'
import { createWorkspace } from '@/actions/workspace'

interface TaskClientProps {
    users: UserTypeNew[]
    tasksWithAssignees: TasksWithAssignees[]
    workspaceUsers: WorkspaceUser[],
    workspaceId: string
    currentUser: UserTypeNew,
    currentUserRole: string | null
}

const TaskClient = ({ users, tasksWithAssignees, workspaceUsers, workspaceId, currentUser, currentUserRole }: TaskClientProps) => {

    const [selectedTask, setSelectedTask] = useState<(typeof tasksWithAssignees)[0] | null>(null);
    const [taskDetailOpen, setTaskDetailOpen] = useState(false);
    const [taskCreateOpen, setTaskCreateOpen] = useState(false);

    const router = useRouter()

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
                <div className='flex gap-3'>

                    <Button onClick={() => setTaskCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                        New Task
                    </Button>
                </div>
            </div>

            <FilterBar users={users} />

            <TaskTable
                onTaskSelect={(task: TasksWithAssignees) => {
                    setSelectedTask(task);
                    setTaskDetailOpen(true)
                }}
                tasksWithAssignees={tasksWithAssignees} />

            {/* Modals */}
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