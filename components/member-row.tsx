"use client"

import { UserTypeNew, UserWithRole } from '@/types/types';
import { useRouter } from 'next/navigation';
import { UserAvatar } from './user-avatar';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { updateUserRole } from '@/actions/workspace';
import { toast } from 'sonner';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import RemoveWorkspaceUserButton from './remove-workspace-member-button';

interface MemeberRowProps {
    user: UserWithRole,
    currentUserRole: string | null,
    workspaceId: string,
    onRemove: (userId: string) => Promise<void>,
    isLoading: boolean,
    currentUser: UserTypeNew
}

type UserRole = "admin" | "member"

function MemberRow({ user, currentUserRole, workspaceId, onRemove, isLoading, currentUser }: MemeberRowProps) {

    const [pendingRole, setPendingRole] = useState(user.role as UserRole);
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    const isSelf = user.id === currentUser.id;
    const isOwner = currentUserRole === 'owner';

    const canChangeRole = isOwner && !isSelf;


    const handleRoleUpdate = async () => {
        setIsUpdating(true);
        const response = await updateUserRole(workspaceId, user.id, pendingRole);
        if (response.success) {
            toast.success(response.message);
            router.refresh()
        } else {
            toast.error(response.message)
        }

        setIsUpdating(false);
    };

    const hasChanged = pendingRole !== user.role;

    return (
        <div className="flex flex-col gap-6 sm:flex-row items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-4">
                <UserAvatar user={{ name: user.name, image: user.image }} className="h-8 w-8" />
                <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {user.role === 'owner' ? (
                    <div className={`text-sm border border-border rounded px-2 py-1 bg-secondary text-secondary-foreground ${isSelf && "font-medium"}`}>
                        Owner
                        {isSelf && " (You)"}
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        {canChangeRole ? (
                            <div className="flex items-center gap-2">
                                <Select
                                defaultValue={user.role as UserRole}
                                onValueChange={(e) => setPendingRole(e as UserRole)}
                                >
                                    <SelectTrigger className="w-[180px] sm:w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                {hasChanged && (
                                    <Button size="sm" onClick={handleRoleUpdate} disabled={isUpdating}>
                                        {isUpdating ? <Loader2 className='h-3 w-3 animate-spin' /> : "Update"}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className={`text-sm px-2.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border ${isSelf && "font-medium"}`}>
                                {pendingRole.charAt(0).toUpperCase() + pendingRole.slice(1)}
                                {isSelf && " (You)"}
                            </div>
                        )}

                        {(isOwner || (currentUserRole === 'admin' && user.role === 'member')) && !isSelf && (
                            <RemoveWorkspaceUserButton workspaceId={workspaceId} user={user}/>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MemberRow