"use client"

import { CardContent } from './ui/card'
import { UserTypeNew, UserWithRole } from '@/types/types'
import { useState } from 'react'
import { removeUser } from '@/actions/workspace'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import MemberRow from './member-row'


function MembersSection({ users, currentUserRole, workspaceId, currentUser }: { users: UserWithRole[], currentUserRole: string | null, workspaceId: string, currentUser: UserTypeNew }) {

    const [role, setRole] = useState("member"); // <--- ROLE CHANGING LOGIC NOT IMPLEMENTED YET
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
        <CardContent>
            <div className="space-y-3">
                {sortedUsers.map((user: any) => (
                    <MemberRow key={user.id} user={user} currentUserRole={currentUserRole} workspaceId={workspaceId} onRemove={handleRemoveUser} isLoading={isLoading} currentUser={currentUser}/>
                ))}
            </div>
        </CardContent>
    )
}

export default MembersSection