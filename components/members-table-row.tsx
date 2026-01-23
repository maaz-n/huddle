"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "./user-avatar"
import RemoveWorkspaceUserButton from "./remove-workspace-member-button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { UserTypeNew, UserWithRole } from "@/types/types"
import { useState } from "react"
import { updateUserRole } from "@/actions/workspace"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface MemberRowProps {
    member: UserWithRole,
    currentUserRole: string | null,
    workspaceId: string
    currentUser: UserTypeNew
}

type UserRole = "admin" | "member" | "owner"

export function MembersTableRow({ member, workspaceId, currentUserRole, currentUser }: MemberRowProps) {

    const router = useRouter()

    const isSelf = member.id === currentUser.id;
    const isOwner = currentUserRole === 'owner';

    const [pendingRole, setPendingRole] = useState(member.role as UserRole)
    const [isUpdating, setIsUpdating] = useState(false)

    const hasChanged = pendingRole !== member.role;
    const canChangeRole = isOwner && !isSelf;

    const handleRoleUpdate = async () => {
        setIsUpdating(true);
        const response = await updateUserRole(workspaceId, member.id, pendingRole);
        if (response.success) {
            toast.success(response.message);
            router.refresh()
        } else {
            toast.error(response.message)
        }

        setIsUpdating(false);
    };

    return (
        <tr className="group border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <UserAvatar user={member} className="h-9 w-9" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{member.name}</span>
                        <span className="text-xs text-muted-foreground md:hidden">{member.email}</span>
                    </div>
                </div>
            </td>

            <td className="px-6 py-4 hidden md:table-cell">
                <span className="text-sm text-muted-foreground">{member.email}</span>
            </td>

            <td className="px-6 py-4">
                <Badge variant="secondary" className={cn(
                    "capitalize font-semibold text-[10px] px-2 py-0",
                    member.role === "owner" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                    member.role === "admin" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}>
                    {member.role}
                </Badge>
            </td>

            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2  transition-opacity">

                    <div className="flex items-center gap-3">

                        <div className="flex items-center gap-2">
                            {member.role === 'owner' ?
                                <div className={`text-sm px-2.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border ${isSelf && "font-medium"}`}>
                                    {pendingRole.charAt(0).toUpperCase() + pendingRole.slice(1)}
                                    {isSelf && " (You)"}
                                </div>
                                :
                                <Select
                                    defaultValue={member.role as UserRole}
                                    onValueChange={(e) => setPendingRole(e as UserRole)}
                                    disabled={!canChangeRole}
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

                            }
                            {hasChanged &&
                                <Button size="sm" onClick={handleRoleUpdate} disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className='h-3 w-3 animate-spin' /> : "Update"}
                                </Button>
                            }

                        </div>


                        {(isOwner || (currentUserRole === 'admin' && member.role === 'member')) && !isSelf && (
                            <RemoveWorkspaceUserButton user={member} workspaceId={workspaceId} />
                        )}
                    </div>
                </div>
            </td>
        </tr>
    )
}