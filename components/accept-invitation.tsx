"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { acceptInvitation } from "@/actions/invitations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  FieldDescription,
  FieldGroup,
} from "@/components/ui/field"
import { UserTypeNew } from "@/types/types"
import { cn } from "@/lib/utils"

export type PendingInvitationDetails = {
  status: "pending"
  token: string
  workspaceId: string
  workspaceName: string
  email: string
  role: "admin" | "member"
  inviterName: string
  expiresAt: string
}

export function AcceptInvitation({
  invitation,
  currentUser,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  invitation: PendingInvitationDetails
  currentUser: UserTypeNew | undefined
}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const next = `/invite/${encodeURIComponent(invitation.token)}`
  const isRightAccount =
    currentUser && currentUser.email.toLowerCase() === invitation.email.toLowerCase()

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      const response = await acceptInvitation(invitation.token)
      if (response.success) {
        toast.success(response.message)
        router.push(`/?workspace=${response.workspaceId}`)
        router.refresh()
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Could not accept the invitation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardHeader>
          <img
            src={"/huddle.svg"}
            alt=""
            className="pt-7 -mb-10 mx-auto w-40 invert-85 dark:invert-0"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Join {invitation.workspaceName}</h1>
                <p className="text-muted-foreground text-balance">
                  {invitation.inviterName} invited you as {invitation.role}.
                </p>
              </div>

              {!currentUser ? (
                <>
                  <p className="rounded-md border bg-muted/30 p-4 text-center text-sm">
                    Sign in or create an account with {invitation.email} to accept.
                  </p>
                  <Button asChild>
                    <Link href={`/login?next=${encodeURIComponent(next)}`}>
                      Sign in to accept
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/signup?next=${encodeURIComponent(next)}`}>
                      Create an account
                    </Link>
                  </Button>
                </>
              ) : !isRightAccount ? (
                <p className="rounded-md border bg-muted/30 p-4 text-center text-sm">
                  This invitation is for {invitation.email}. Sign in with that
                  address to accept it.
                </p>
              ) : (
                <Button type="button" onClick={handleAccept} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    "Accept invitation"
                  )}
                </Button>
              )}

              <FieldDescription className="text-center">
                <Link href="/">Go to Huddle</Link>
              </FieldDescription>
            </FieldGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
