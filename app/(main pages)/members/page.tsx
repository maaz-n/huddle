import { getCurrentUser, getUserWorkspaceRole } from '@/actions/auth';
import { getWorkspacesWithRoles, getWorkspaceUsers } from '@/actions/workspace';
import { AppLayout } from '@/components/app-layout'
import { MembersTable } from '@/components/members-table';
import { Input } from '@/components/ui/input';
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
            <div className="py-8 px-12 space-y-8 max-w-6xl mx-auto">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold">Members</h1>
                    <p className="text-muted-foreground mt-2">Manage people in this workspace</p>
                </div>
                <div className='flex flex-col gap-2'>
                    <Input className='w-1/3 ml-auto justify-end' placeholder='Search members in this workspace' />
                    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden border-border/60">
                       <MembersTable members={users} workspaceId={workspaceId} currentUserRole={currentUserRole} user={currentUser}/>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

export default MembersPage