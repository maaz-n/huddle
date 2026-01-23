"use client"

import { SearchInput } from './search-input'
import AddMemberSection from './add-member-section'
import { MembersTable } from './members-table'
import { UserTypeNew, UserWithRole } from '@/types/types'
import { useState } from 'react'

interface MembersWrapperProps {
    workspaceId: string,
    currentUserRole: "owner" | "admin" | "member" | null,
    users: UserWithRole[],
    currentUser: UserTypeNew,
}

const MembersWrapper = ({ workspaceId, currentUserRole, users, currentUser }: MembersWrapperProps) => {

    const [search, setSearch] = useState("");

    const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(search))


    return (
        <>
            <div className='flex justify-between mt-14'>
                <SearchInput  onChange={(e) => setSearch(e.target.value)}/>
                <AddMemberSection workspaceId={workspaceId} currentUserRole={currentUserRole} />
            </div>
            <div className="mt-4">
                <MembersTable members={filteredUsers} workspaceId={workspaceId} currentUserRole={currentUserRole} user={currentUser} />
            </div>
        </>
    )
}

export default MembersWrapper