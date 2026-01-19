import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        if (workspaces.length === 0) redirect("/onboarding")
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
            <div className="py-8 px-12 space-y-8 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage workspace and profile settings</p>
                </div>


                <div className="max-w-6xl mx-auto py-12">
                    <UserProfile user={currentUser} />
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

                        <div className="flex-none lg:w-[380px] space-y-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground">
                                Workspace Members
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Manage your team’s access, roles, and workspace invitations.
                                Invite new collaborators to work on projects together.
                            </p>
                        </div>

                        <div className="flex-1 min-w-0 space-y-6">
                            <div className="flex justify-end">
                                <AddMemberSection
                                    workspaceId={workspaceId}
                                    currentUserRole={currentUserRole}
                                />
                            </div>

                            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden border-border/60">
                                <MembersSection
                                    users={users}
                                    currentUserRole={currentUserRole}
                                    currentUser={currentUser}
                                    workspaceId={workspace.id}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                <WorkspaceSettingsSection currentUserRole={currentUserRole} workspace={workspace} />

                <div className="py-12">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 lg:justify-between lg:items-center">

                        <div className="flex-none lg:w-[380px] space-y-2">
                            <h2 className="text-xl font-bold tracking-tight text-foreground">
                                Delete Workspace
                            </h2>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                Permanently remove this workspace and all associated data.
                                This action is irreversible and cannot be recovered.
                            </p>
                        </div>

                        <DeleteWorkspaceButton workspaceId={workspace.id} />

                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
