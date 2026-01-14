"use client"

import { CardContent } from './ui/card'
import { UserAvatar } from './user-avatar'
import { X } from 'lucide-react'
import { UserTypeNew } from '@/types/types'
import { useState } from 'react'

type Role = 'admin' | 'member';

function MembersSection({ users, currentUser }: { users: UserTypeNew[], currentUser: UserTypeNew }) {

    const [role, setRole] = useState<Role>("member");

    const sortedUsers = [...users].sort((a, b) => {
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return 0;
    }
    )
    return (
        <CardContent>
            <div className="space-y-3">
                {sortedUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                            <UserAvatar user={{ name: user.name, image: user.image }} className="h-8 w-8" />
                            <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {user.role === 'owner'? 
                            <div className='text-sm border border-border rounded px-2 py-1 opacity-50 cursor-not-allowed bg-muted text-muted-foreground'>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </div>
                            : 
                            <select defaultValue={user.role} className={`
                                                text-sm border border-border rounded px-2 py-1
                                                disabled:opacity-50 
                                                disabled:cursor-not-allowed 
                                                disabled:bg-muted 
                                                disabled:text-muted-foreground
                                            `} disabled={user.id === currentUser.id} onChange={(e) => setRole(e.target.value as Role)}>
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                            </select>
                            }
                            
                            {user.id !== currentUser.id && (
                                <button className="p-1 hover:bg-secondary rounded transition-colors">
                                    <X className="h-4 w-4 text-destructive" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    )
}

export default MembersSection