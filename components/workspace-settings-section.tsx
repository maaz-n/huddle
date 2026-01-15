"use client"

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useState } from 'react'
import { updateWorkspaceName } from '@/actions/workspace'
import { toast } from 'sonner'
import { Workspace } from '@/types/types'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface WorkspaceSettingsSectionProps {
    currentUserRole: string | null,
    workspace: Workspace
}

function WorkspaceSettingsSection({ currentUserRole, workspace }: WorkspaceSettingsSectionProps) {

    const [name, setName] = useState(workspace.name);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setIsLoading(true);
            const response = await updateWorkspaceName(workspace.id, name);
            if (response.success) {
                toast.success(response.message);
                router.refresh()
            } else {
                toast.error(response.message)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workspace Settings</CardTitle>
            </CardHeader>
            <CardContent >
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="space-y-2">
                        <Label htmlFor="workspace-name">Workspace Name</Label>
                        <Input id="workspace-name" value={name} onChange={(e) => setName(e.target.value)} disabled={currentUserRole !== "owner"} className="disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground" />
                    </div>
                    <Button className="bg-primary hover:bg-primary/90" disabled={currentUserRole !== "owner" || name === workspace.name || isLoading}>
                    {isLoading ? <div className='flex gap-2'>
                        <Loader2 className='h-4 w-4 animate-spin'/>
                        <span>Updating</span>
                    </div> : <span>Update Name</span> }
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export default WorkspaceSettingsSection