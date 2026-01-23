"use client"

import { UserTypeNew, UserWithRole } from "@/types/types"
import { MembersTableRow } from "./members-table-row"

interface MembersTableProps {
    members: UserWithRole[],
    user: UserTypeNew,
    currentUserRole: string | null,
    workspaceId: string
}

export function MembersTable({ members, workspaceId, currentUserRole, user }: MembersTableProps) {

    return (
        <>  
            <div className="w-full rounded-2xl border bg-card shadow-sm overflow-x-scroll sm:overflow-hidden border-border/60">
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

                        { members.length > 0 ?
                        members.map((member) => (
                            <MembersTableRow
                                key={member.id}
                                member={member}
                                currentUserRole={currentUserRole}
                                workspaceId={workspaceId}
                                currentUser={user}
                            />
                        ))
                    :
                    <tr className="text-center">
                        <td colSpan={4} className="py-5 text-muted-foreground/70 text-center">
                            There are no members with that name...
                        </td>
                    </tr>
                    }
                    </tbody>
                </table>
            </div>
        </>
    )
}