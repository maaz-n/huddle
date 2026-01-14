import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/user-avatar"
import { X } from "lucide-react"
import { getWorkspace, getWorkspacesWithRoles, getWorkspaceUsers } from "@/actions/workspace"
import { redirect } from "next/navigation"
import UserProfile from "@/components/user-profile"
import { getCurrentUser, getUserWorkspaceRole } from "@/actions/auth"
import AddMemberSection from "@/components/add-member-section"
import MembersSection from "@/components/members-section"
import WorkspaceSettingsSection from "@/components/workspace-settings-section"

export default async function SettingsPage(props: any) {

    const searchParams = await props.searchParams;
    let workspaceId = searchParams.workspace;

    if (!workspaceId) {
        const workspaces = await getWorkspacesWithRoles();
        workspaceId = workspaces[0].workspaceId;
        redirect(`/settings?workspace=${workspaceId}`)
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    const userRole = await getUserWorkspaceRole(workspaceId);

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
                    <AddMemberSection workspaceId={workspaceId} userRole={userRole} />
                    <MembersSection users={users} userRole={userRole} />
                </Card>

                <WorkspaceSettingsSection userRole={userRole} workspace={workspace}/>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Irreversible actions. Proceed with caution.</p>
                        <Button
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
                        >
                            Delete Workspace
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
