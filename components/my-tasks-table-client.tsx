"use client"

import { TasksWithAssignees, UserTypeNew } from "@/types/types";
import { MyTasksTable } from "./my-tasks-table"
import { useState } from "react";
import { TaskDetailModal } from "./task-detail-modal";

interface MyTasksTableProps {
    myTasks: TasksWithAssignees[],
    currentUserRole: string | null,
    workspaceId: string,
    currentUser: UserTypeNew
}

const MyTasksTableClient = ({ myTasks, workspaceId, currentUserRole, currentUser }: MyTasksTableProps) => {

    const [selectedTask, setSelectedTask] = useState<TasksWithAssignees | null>(null);
    const [taskDetailOpen, setTaskDetailOpen] = useState(false);

    return (
        <>
            <MyTasksTable tasks={myTasks} workspaceId={workspaceId} currentUserRole={currentUserRole} currentUser={currentUser}
                onTaskSelect={(task: TasksWithAssignees) => {
                    setSelectedTask(task);
                    setTaskDetailOpen(true)
                }}
            />

            <TaskDetailModal
                task={selectedTask}
                open={taskDetailOpen}
                onOpenChange={setTaskDetailOpen}
                workspaceId={workspaceId}
                currentUser={currentUser}
                currentUserRole={currentUserRole}
            />
        </>
    )
}

export default MyTasksTableClient