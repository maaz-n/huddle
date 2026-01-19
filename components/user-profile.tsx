"use client"

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { UserAvatar } from './user-avatar'
import { Label } from '@radix-ui/react-label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useState } from 'react'
import { updateUser } from '@/actions/user'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { UserTypeNew } from '@/types/types'
import { useRouter } from 'next/navigation'

function UserProfile({ user }: { user: UserTypeNew }) {

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
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-xl font-semibold">Profile Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                    This is how others will see you on the platform.
                </p>
            </CardHeader>

            <CardContent className="px-0 pt-6">
                <form onSubmit={handleUpdate} className="divide-y divide-border">

                    <div className="grid grid-cols-1 md:grid-cols-3 py-6 gap-4">
                        <div>
                            <Label className="text-base">Profile Picture</Label>
                            <p className="text-sm text-muted-foreground">Your picture for workspaces.</p>
                        </div>
                                <UserAvatar user={user} className="h-20 w-20 ring-4 ring-background shadow-sm" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 py-6 gap-4">
                        <div>
                            <Label htmlFor="name" className="text-base">Display Name</Label>
                            <p className="text-sm text-muted-foreground">Your display name.</p>
                        </div>
                        <div className="md:col-span-2">
                            <Input
                                id="name"
                                defaultValue={user.name}
                                onChange={(e) => setName(e.target.value)}
                                className="max-w-md h-10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 py-6 gap-4">
                        <div>
                            <Label htmlFor="email" className="text-base">Email Address</Label>
                            <p className="text-sm text-muted-foreground">Contact your admin to change this.</p>
                        </div>
                        <div className="md:col-span-2">
                            <Input
                                id="email"
                                type="email"
                                defaultValue={user.email}
                                disabled
                                className="max-w-md h-10 bg-muted/50 border-dashed"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <Button
                            type="submit"
                            className="px-8 shadow-lg shadow-primary/20"
                            disabled={loading || name === user.name}
                        >
                            {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : "Save Changes"}
                        </Button>
                    </div>

                </form>
            </CardContent>
        </Card>
    )
}

export default UserProfile