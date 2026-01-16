import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getWorkspace, getWorkspacesWithRoles, getWorkspaceUsers } from "@/actions/workspace"
import { redirect } from "next/navigation"
import UserProfile from "@/components/user-profile"
import { getCurrentUser, getUserWorkspaceRole } from "@/actions/auth"
import AddMemberSection from "@/components/add-member-section"
import MembersSection from "@/components/members-section"
import WorkspaceSettingsSection from "@/components/workspace-settings-section"
import DeleteWorkspaceButton from "@/components/delete-workspace-button"

export default async function SettingsPage(props: any) {

    const searchParams = await props.searchParams;
    let workspaceId = searchParams.workspace;

    if (!workspaceId) {
        const workspaces = await getWorkspacesWithRoles();
        if(workspaces.length === 0) redirect("/onboarding")
        workspaceId = workspaces[0].workspaceId;
        redirect(`/settings?workspace=${workspaceId}`)
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const currentUserRole = await getUserWorkspaceRole(workspaceId);

    const users = await getWorkspaceUsers(workspaceId);

    const workspace = await getWorkspace(workspaceId)

    return (
        <AppLayout>
            <div className="py-8 px-6 space-y-8 max-w-4xl">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage workspace and profile settings</p>
                </div>

                <UserProfile user={currentUser} />

                <Card>
                    <AddMemberSection workspaceId={workspaceId} currentUserRole={currentUserRole} />
                    <MembersSection users={users} currentUserRole={currentUserRole} currentUser={currentUser} workspaceId={workspace.id}/>
                </Card>

                <WorkspaceSettingsSection currentUserRole={currentUserRole} workspace={workspace}/>

                <Card>
                    <CardHeader>
                        <CardTitle>Delete Workspace</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Irreversible actions. Proceed with caution.</p>
                        <DeleteWorkspaceButton workspaceId={workspace.id}/>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
