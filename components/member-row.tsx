"use client"

import { UserWithRole } from '@/types/types';
import { useRouter } from 'next/navigation';
import { UserAvatar } from './user-avatar';
import { Button } from './ui/button';
import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { updateUserRole } from '@/actions/workspace';
import { toast } from 'sonner';

interface MemeberRowProps {
    user: UserWithRole,
    currentUserRole: string | null,
    workspaceId: string,
    onRemove: (userId: string) => Promise<void>,
    isLoading: boolean
}

type UserRole = "admin" | "member"

function MemberRow({ user, currentUserRole, workspaceId, onRemove, isLoading }: MemeberRowProps) {

    const [pendingRole, setPendingRole] = useState(user.role as UserRole);
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    const handleRoleUpdate = async () => {
        setIsUpdating(true);
        
        // console.log(pendingRole)

        const response = await updateUserRole(workspaceId, user.id, pendingRole);
        if(response.success){
            toast.success(response.message);
            router.refresh()
        } else {
            toast.error(response.message)
        }

        setIsUpdating(false);
    };

    const hasChanged = pendingRole !== user.role;

    return (
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-4">
                <UserAvatar user={{ name: user.name, image: user.image }} className="h-8 w-8" />
                <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {user.role === 'owner' ? (
                    <div className='text-sm border border-border rounded px-2 py-1 opacity-50 cursor-not-allowed bg-muted text-muted-foreground'>
                        Owner
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <select 
                            value={pendingRole ?? "member"}
                            className="text-sm border border-border rounded px-2 py-1 disabled:opacity-50"
                            disabled={currentUserRole === 'member' || isUpdating}
                            onChange={(e) => setPendingRole(e.target.value as UserRole)}
                        >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                        </select>

                        {hasChanged && (
                            <Button size="sm" onClick={handleRoleUpdate} disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update"}
                            </Button>
                        )}
                    </div>
                )}

                {currentUserRole === "owner" && user.role !== "owner" && (
                    <button 
                        className="p-1 hover:bg-secondary rounded transition-colors" 
                        onClick={() => onRemove(user.id)} 
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className='h-4 w-4 text-destructive animate-spin' /> : <X className="h-4 w-4 text-destructive" />}
                    </button>
                )}
            </div>
        </div>
    );
}

export default MemberRow