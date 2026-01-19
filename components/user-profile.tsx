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

                    <div className="flex flex-col lg:flex-row py-8 gap-12 lg:gap-24">
                        <div className="flex-none lg:w-[380px] space-y-1">
                            <Label className="text-base font-semibold">Profile Picture</Label>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Your personal branding across all workspaces.
                            </p>
                        </div>
                        <UserAvatar user={user} className="h-20 w-20 ring-4 ring-background shadow-md" />


                    </div>

                    <div className="flex flex-col lg:flex-row py-8 gap-12 lg:gap-24">
                        <div className="flex-none lg:w-[380px] space-y-1">
                            <Label htmlFor="name" className="text-base font-semibold">Display Name</Label>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                This name will be visible to your teammates.
                            </p>
                        </div>
                        <div className="flex-1">
                            <Input
                                id="name"
                                defaultValue={user.name}
                                onChange={(e) => setName(e.target.value)}
                                className="max-w-md h-11 bg-muted/20"
                                placeholder="Your full name"
                            />
                        </div>
                    </div>

                    {/* Row 3: Email */}
                    <div className="flex flex-col lg:flex-row py-8 gap-12 lg:gap-24">
                        <div className="flex-none lg:w-[380px] space-y-1">
                            <Label htmlFor="email" className="text-base font-semibold">Email Address</Label>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                The email associated with your account.
                            </p>
                        </div>
                        <div className="flex-1">
                            <Input
                                id="email"
                                type="email"
                                defaultValue={user.email}
                                disabled
                                className="max-w-md h-11 bg-muted/50 border-dashed cursor-not-allowed opacity-70"
                            />
                            <p className="text-[11px] text-muted-foreground mt-2 italic">
                                Email changes must be handled by your workspace administrator.
                            </p>
                        </div>
                    </div>

                    <div className="py-8 flex justify-end">
                        <Button
                            type="submit"
                            className="px-10 h-11 shadow-lg shadow-primary/20 transition-all hover:-translate-y-px"
                            disabled={loading || name === user.name}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>

                </form>
            </CardContent>
        </Card>
    )
}

export default UserProfile