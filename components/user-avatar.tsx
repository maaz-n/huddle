"use client"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Actor, UserTypeNew } from "@/types/types"

interface UserAvatarProps {
  user?: UserTypeNew | Actor,
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {

  if (!user) throw new Error("Could not fetch user!")

  return (
    <Avatar className={className}>
      <AvatarImage src={user.image || "/placeholder.png"} alt={user.name} />
    </Avatar>
  )
}
