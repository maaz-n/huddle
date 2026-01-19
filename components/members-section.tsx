"use client"

import { UserTypeNew, UserWithRole } from '@/types/types'
import { useState } from 'react'
import { removeUser } from '@/actions/workspace'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import MemberRow from './member-row'


function MembersSection({ users, currentUserRole, workspaceId, currentUser }: { users: UserWithRole[], currentUserRole: string | null, workspaceId: string, currentUser: UserTypeNew }) {

    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const sortedUsers = [...users].sort((a, b) => {
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return 0;
    }
    )

    async function handleRemoveUser(userId: string) {
        try {
            setIsLoading(true)
            const response = await removeUser(workspaceId, userId);
            if (response.success) {
                toast.success(response.message)
                router.refresh()
            } else {
                toast.error(response.message)
            }
        } catch (error) {
            throw error
        } finally {
            setIsLoading(false)
        }

    }
    return (
        <div className="divide-y divide-border">
            {sortedUsers.length > 0 ? (
                sortedUsers.map((user: any) => (
                    <div key={user.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <MemberRow
                            user={user}
                            currentUserRole={currentUserRole}
                            workspaceId={workspaceId}
                            onRemove={handleRemoveUser}
                            isLoading={isLoading}
                            currentUser={currentUser}
                        />
                    </div>
                ))
            ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                    No members found in this workspace.
                </div>
            )}
        </div>
    )
}

export default MembersSection