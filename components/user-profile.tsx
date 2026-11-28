"use client"

import { Card, CardContent } from './ui/card'
import { UserAvatar } from './user-avatar'
import { Label } from '@radix-ui/react-label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { useState } from 'react'
import { updateEmailNotifications, updateUser } from '@/actions/user'
import { removeAvatar, uploadAvatar } from '@/actions/avatar'
import { toast } from 'sonner'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { UserTypeNew } from '@/types/types'
import { useRouter } from 'next/navigation'
import { Switch } from './ui/switch'

function UserProfile({ user }: { user: UserTypeNew }) {

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user.name);
    const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications ?? true);
    const [savingPreference, setSavingPreference] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarSrc, setAvatarSrc] = useState(user.image);
    const router = useRouter()

    async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const file = input.files?.[0]
        if (!file) return

        setUploadingAvatar(true)
        const formData = new FormData()
        formData.set('file', file)

        try {
            const response = await uploadAvatar(formData)
            if (response.success && response.imageUrl) {
                setAvatarSrc(`${response.imageUrl}?v=${Date.now()}`)
                toast.success(response.message)
                router.refresh()
            } else {
                toast.error(response.message)
            }
        } catch (error) {
            console.error(error)
            toast.error('Could not upload the image')
        } finally {
            setUploadingAvatar(false)
            input.value = ''
        }
    }

    async function handleRemoveAvatar() {
        setUploadingAvatar(true)
        try {
            const response = await removeAvatar()
            if (response.success) {
                setAvatarSrc(null)
                toast.success(response.message)
                router.refresh()
            } else {
                toast.error(response.message)
            }
        } catch (error) {
            console.error(error)
            toast.error('Could not remove the image')
        } finally {
            setUploadingAvatar(false)
        }
    }

    async function handleUpdate() {
        try {
            setLoading(true);
            const response = await updateUser(name)
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

    async function handleEmailToggle(enabled: boolean) {
        const previous = emailNotifications;
        setEmailNotifications(enabled);
        setSavingPreference(true);

        try {
            const response = await updateEmailNotifications(enabled);
            if (response.success) {
                toast.success(response.message);
            } else {
                setEmailNotifications(previous);
                toast.error(response.message);
            }
        } catch (error) {
            console.error(error);
            setEmailNotifications(previous);
            toast.error("Could not update email preferences");
        } finally {
            setSavingPreference(false);
        }
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardContent className='my-0'>
                {user.isDemo && (
                    <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                        Demo account. Profile settings are read-only. Use “Reset demo” in the banner above to restore sample data.
                    </div>
                )}
                <form onSubmit={handleUpdate} className="divide-y divide-border">
                    <div className="flex flex-col lg:flex-row py-8 gap-12 lg:gap-24">
                        <div className="flex-none lg:w-[380px] space-y-1">
                            <Label className="text-base font-semibold">Profile Picture</Label>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Your personal branding across all workspaces.
                            </p>
                        </div>
                        <div className="flex flex-1 flex-col items-start gap-3">
                            <UserAvatar
                                user={{ ...user, image: avatarSrc }}
                                className="h-20 w-20 ring-4 ring-background shadow-md"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    id="avatar-input"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                    disabled={uploadingAvatar || user.isDemo}
                                />
                                <Button variant="outline" size="sm" asChild>
                                    <label
                                        htmlFor="avatar-input"
                                        className={
                                            uploadingAvatar || user.isDemo
                                                ? 'pointer-events-none cursor-default gap-2 opacity-50'
                                                : 'cursor-pointer gap-2'
                                        }
                                    >
                                        {uploadingAvatar ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Camera className="h-4 w-4" />
                                        )}
                                        Change photo
                                    </label>
                                </Button>
                                {avatarSrc && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveAvatar}
                                        disabled={uploadingAvatar || user.isDemo}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                PNG, JPEG, WebP, or GIF up to 2 MB.
                            </p>
                        </div>

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
                                disabled={user.isDemo}
                            />
                        </div>
                    </div>

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

                    <div className="flex flex-col lg:flex-row py-8 gap-12 lg:gap-24">
                        <div className="flex-none lg:w-[380px] space-y-1">
                            <Label className="text-base font-semibold">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Get an email when you are assigned a task or when changes are requested.
                            </p>
                        </div>
                        <div className="flex flex-1 items-center gap-3">
                            <Switch
                                checked={emailNotifications}
                                onCheckedChange={handleEmailToggle}
                                disabled={savingPreference || user.isDemo}
                                aria-label="Email notifications"
                            />
                            <span className="text-sm text-muted-foreground">
                                {emailNotifications ? "On" : "Off"}
                            </span>
                        </div>
                    </div>

                    <div className="py-8 flex justify-end">
                        <Button
                            type="submit"
                            className="px-10 h-11 shadow-lg shadow-primary/20 transition-all hover:-translate-y-px"
                            disabled={loading || name === user.name || user.isDemo}
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
