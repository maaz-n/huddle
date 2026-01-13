import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserAvatar } from "@/components/user-avatar"
import { X } from "lucide-react"
import { getWorkspacesWithRoles, getWorkspaceUsers } from "@/actions/workspace"
import { redirect } from "next/navigation"
import UserProfile from "@/components/user-profile"
import { getCurrentUser } from "@/actions/auth"
import AddMemberSection from "@/components/add-member-section"

const mockUser = {
    name: "John Doe",
    email: "john@example.com",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
}

const mockMembers = [
    { id: "1", name: "John Doe", email: "john@example.com", role: "admin", image: mockUser.image },
    {
        id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
        role: "member",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    },
    {
        id: "3",
        name: "Bob Johnson",
        email: "bob@example.com",
        role: "member",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    },
]

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

    const users = await getWorkspaceUsers(workspaceId);

    return (
        <AppLayout>
            <div className="py-8 px-6 space-y-8 max-w-4xl">
                <div>
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage workspace and profile settings</p>
                </div>

                <UserProfile user={currentUser} />

                <Card>
                    <AddMemberSection workspaceId={workspaceId}/>
                    <CardContent>
                        <div className="space-y-3">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <UserAvatar user={{ name: user.name, image: user.image }} className="h-8 w-8" />
                                        <div>
                                            <p className="font-medium text-sm">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select defaultValue={user.role} className={`
                                                text-sm border border-border rounded px-2 py-1
                                                disabled:opacity-50 
                                                disabled:cursor-not-allowed 
                                                disabled:bg-muted 
                                                disabled:text-muted-foreground
                                            `} disabled={user.id === currentUser.id} >
                                            <option value="admin">Owner</option>
                                            <option value="member">Admin</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                        {user.id !== currentUser.id && (
                                            <button className="p-1 hover:bg-secondary rounded transition-colors">
                                                <X className="h-4 w-4 text-destructive" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Workspace Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="workspace-name">Workspace Name</Label>
                            <Input id="workspace-name" defaultValue="Engineering" />
                        </div>
                        <div className="flex gap-2">
                            <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
                            <Button variant="outline">Reset</Button>
                        </div>
                    </CardContent>
                </Card>

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
