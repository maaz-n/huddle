"use client"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { UserType } from "@/types/types"

interface UserAvatarProps {
  user: UserType,
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {

  if (!user) throw new Error("Could not fetch user!")

  return (
    <Avatar className={className}>
      <AvatarImage src={user.image || "/placeholder.png"} alt={user?.name} />
    </Avatar>
  )
}
