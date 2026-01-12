"use client"

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { UserAvatar } from './user-avatar'
import { Label } from '@radix-ui/react-label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useAppData } from './app-data-provider'
import { useState } from 'react'
import { updateUser } from '@/actions/user'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { UserType } from '@/types/types'
import { useRouter } from 'next/navigation'

function UserProfile({ user }: { user: UserType }) {

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user.name);
    const router = useRouter()

    async function handleUpdate() {
        try {
            setLoading(true);
            const response = await updateUser(name, user.email)
            if (response.success) {
                toast.success(response.message);
                router.refresh();
                
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <form action={handleUpdate}>
                    <div className="flex items-start gap-6">
                        <UserAvatar user={user} className="h-16 w-16" />
                        <div className="flex-1 space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" defaultValue={user.name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue={user.email} disabled />
                            </div>
                            <Button className="bg-primary hover:bg-primary/90" disabled={loading}>
                                {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : "Save Changes"}
                            </Button>
                        </div>
                    </div>

                </form>
            </CardContent>
        </Card>
    )
}

export default UserProfile