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
        <div className="py-12">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

                <div className="flex-none lg:w-[380px] space-y-2">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Workspace Details
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                        The name of your workspace and general organizational settings.
                        Only workspace owners can modify these details.
                    </p>
                </div>

                <div className="flex-1 min-w-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="rounded-2xl border bg-card p-6 shadow-sm border-border/60">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="workspace-name"
                                        className="text-sm font-semibold text-foreground/70"
                                    >
                                        Workspace Name
                                    </Label>
                                    <Input
                                        id="workspace-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={currentUserRole !== "owner"}
                                        placeholder="e.g. Acme Marketing"
                                        className="max-w-md h-11 bg-muted/20 focus-visible:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {currentUserRole !== "owner" && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                            You don't have permission to rename this workspace.
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2 flex justify-end border-t border-border/40 mt-6">
                                    <Button
                                        type="submit"
                                        className="px-6 shadow-lg shadow-primary/10"
                                        disabled={currentUserRole !== "owner" || name === workspace.name || isLoading}
                                    >
                                        {isLoading ? (
                                            <div className='flex items-center gap-2'>
                                                <Loader2 className='h-4 w-4 animate-spin' />
                                                <span>Updating...</span>
                                            </div>
                                        ) : (
                                            "Update Name"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    )
}

export default WorkspaceSettingsSection