export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation'

import { getUserWorkspaceRole } from '@/actions/auth'
import { getWorkspaceActivity } from '@/actions/activity'
import { getWorkspacesWithRoles } from '@/actions/workspace'
import { AppLayout } from '@/components/app-layout'
import { ActivityFeed } from '@/components/activity-feed'

async function ActivityPage(props: {
    searchParams: Promise<{ workspace?: string }>
}) {
    const searchParams = await props.searchParams
    let workspaceId = searchParams.workspace

    if (!workspaceId) {
        const workspaces = await getWorkspacesWithRoles()
        if (workspaces.length === 0) redirect("/onboarding")
        workspaceId = workspaces[0].workspaceId
        redirect(`/activity?workspace=${workspaceId}`)
    }

    const currentUserRole = await getUserWorkspaceRole(workspaceId)
    if (!currentUserRole) redirect("/")

    const items = await getWorkspaceActivity(workspaceId)

    return (
        <AppLayout>
            <div className="py-8 px-12 max-w-6xl mx-auto space-y-6">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">Activity</h1>
                    <p className="text-muted-foreground mt-2">
                        Everything happening in this workspace
                    </p>
                </div>
                <div className="rounded-lg border bg-card p-6">
                    <ActivityFeed workspaceId={workspaceId} initialItems={items} />
                </div>
            </div>
        </AppLayout>
    )
}

export default ActivityPage
