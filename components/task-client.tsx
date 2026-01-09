"use client"

import { TasksWithAssignees, UserType } from '@/types/types'
import { FilterBar } from './filter-bar'
import { TaskTable } from './task-table'
import { useState } from 'react'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import { TaskDetailModal } from './task-detail-modal'

const TaskClient = ({ adminUsers, tasksWithAssignees }: { adminUsers: UserType[], tasksWithAssignees: TasksWithAssignees[] }) => {

    const [selectedTask, setSelectedTask] = useState<(typeof tasksWithAssignees)[0] | null>(null)
    const [taskDetailOpen, setTaskDetailOpen] = useState(false)
    const [taskCreateOpen, setTaskCreateOpen] = useState(false)

    console.log(selectedTask)

    return (
        <div className="py-8 px-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Tasks</h1>
                    <p className="text-muted-foreground mt-2">Manage all your tasks in one place</p>
                </div>
                <Button onClick={() => setTaskCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
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
            {/* <TaskCreateModal open={taskCreateOpen} onOpenChange={setTaskCreateOpen} onCreateTask={handleCreateTask} /> */}
        </div>
    )
}

export default TaskClient