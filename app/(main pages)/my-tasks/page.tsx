import { getMyTasks } from '@/actions/tasks'
import { getWorkspacesWithRoles } from '@/actions/workspace';
import { AppLayout } from '@/components/app-layout'
import { MyTasksTable } from '@/components/my-tasks-table';
import { redirect } from 'next/navigation';
import React from 'react'

async function MyTasksPage(props: any) {

    const searchParams = await props.searchParams;
    let workspaceId = searchParams.workspace;

    if (!workspaceId) {
        const workspaces = await getWorkspacesWithRoles();
        if (workspaces.length === 0) redirect("/onboarding")
        workspaceId = workspaces[0].workspaceId;
        redirect(`/my-tasks?workspace=${workspaceId}`)
    }
    const myTasks = await getMyTasks(workspaceId)

    return (
        <AppLayout>
            <div className="py-8 px-12 max-w-6xl mx-auto">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">My Tasks</h1>
                    <p className="text-muted-foreground mt-2">Manage all your tasks</p>
                </div>
                <MyTasksTable tasks={myTasks} />

            </div>
        </AppLayout>
    )
}

export default MyTasksPage