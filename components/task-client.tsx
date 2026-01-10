"use client"

import { InsertTask, TasksWithAssignees, UserType, Workspace } from '@/types/types'
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

const TaskClient = ({ adminUsers, tasksWithAssignees, workspaces }: { adminUsers: UserType[], tasksWithAssignees: TasksWithAssignees[], workspaces: Workspace[] }) => {

    const [selectedTask, setSelectedTask] = useState<(typeof tasksWithAssignees)[0] | null>(null);
    const [taskDetailOpen, setTaskDetailOpen] = useState(false);
    const [taskCreateOpen, setTaskCreateOpen] = useState(false);
    const [workspaceCreateOpen, setWorkspaceCreateOpen] = useState(false);

    const router = useRouter()

    const handleCreateTask = async (data: InsertTask) => {
        try {
            const { workspaceId, title, description, status, priority, assigneeId } = data;
            const response = await createTask(workspaceId, title, description, status, priority, assigneeId);

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

    const handleCreateWorkspace = async (name: string) => {
        try {
            const response = await createWorkspace(name);

            if (response.success) {
                toast.success(response.message);
                router.refresh();
            } else {
                toast.error(response.message);
            }

        } catch (error) {
            console.error(error);
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
                    <Button onClick={() => setWorkspaceCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                        New Workspace
                    </Button>
                </div>
            </div>

            <FilterBar adminUsers={adminUsers} />

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
            />
            <TaskCreateModal open={taskCreateOpen} onOpenChange={setTaskCreateOpen} onCreateTask={handleCreateTask} workspaces={workspaces} />

            <WorkspaceCreateModal open={workspaceCreateOpen} onOpenChange={setWorkspaceCreateOpen} onCreateWorkspace={handleCreateWorkspace} workspaces={workspaces} />
        </div>
    )
}

export default TaskClient