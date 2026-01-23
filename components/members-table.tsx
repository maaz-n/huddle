"use client"

import { UserTypeNew, UserWithRole } from "@/types/types"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { MembersTableRow } from "./members-table-row"

interface MembersTableProps {
    members: UserWithRole[],
    user: UserTypeNew,
    currentUserRole: string | null,
    workspaceId: string
}

export function MembersTable({ members, workspaceId, currentUserRole, user }: MembersTableProps) {

    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter();

    return (
        <div className="w-full">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-border text-xs font-bold uppercase tracking-widest text-muted-foreground/70 bg-muted/20">
                        <th className="px-6 py-4">Member</th>
                        <th className="px-6 py-4 hidden md:table-cell">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((member) => (
                        <MembersTableRow
                            key={member.id}
                            member={member}
                            currentUserRole={currentUserRole}
                            workspaceId={workspaceId}
                            currentUser={user}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
}