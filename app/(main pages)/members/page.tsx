import { getCurrentUser, getUserWorkspaceRole } from '@/actions/auth';
import { getWorkspacesWithRoles, getWorkspaceUsers } from '@/actions/workspace';
import { AppLayout } from '@/components/app-layout'
import MembersWrapper from '@/components/members-wrapper';
import { redirect } from 'next/navigation';

async function MembersPage(props: any) {

    const searchParams = await props.searchParams;
    let workspaceId = searchParams.workspace;

    if (!workspaceId) {
        const workspaces = await getWorkspacesWithRoles();
        if (workspaces.length === 0) redirect("/onboarding")
        workspaceId = workspaces[0].workspaceId;
        redirect(`/members?workspace=${workspaceId}`)
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const currentUserRole = await getUserWorkspaceRole(workspaceId);

    const users = await getWorkspaceUsers(workspaceId);

    return (
        <AppLayout>
            <div className="py-8 px-12 max-w-6xl mx-auto">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">Members</h1>
                    <p className="text-muted-foreground mt-2">Manage people in this workspace</p>
                </div>
                <MembersWrapper workspaceId={workspaceId} users={users} currentUser={currentUser} currentUserRole={currentUserRole}/>
            </div>
        </AppLayout>
    )
}

export default MembersPage