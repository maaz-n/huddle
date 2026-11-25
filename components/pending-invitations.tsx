"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { revokeInvitation } from "@/actions/invitations"
import { Button } from "@/components/ui/button"

export type PendingInvitation = {
  id: string
  email: string
  role: "admin" | "member"
  expiresAt: string
}

export default function PendingInvitations({
  workspaceId,
  invitations,
}: {
  workspaceId: string
  invitations: PendingInvitation[]
}) {
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const router = useRouter()

  if (invitations.length === 0) return null

  async function handleRevoke(id: string) {
    setRevokingId(id)
    try {
      const response = await revokeInvitation(workspaceId, id)
      if (response.success) {
        toast.success(response.message)
        router.refresh()
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Could not revoke the invitation")
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="mt-10 rounded-2xl border bg-card p-6 shadow-sm border-border/60">
      <h3 className="text-sm font-semibold">Pending invitations</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        These links expire after 7 days.
      </p>
      <div className="mt-4 divide-y divide-border">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{invitation.email}</p>
              <p className="text-xs text-muted-foreground">
                Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded bg-secondary px-2 py-0.5 text-xs capitalize text-secondary-foreground">
                {invitation.role}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevoke(invitation.id)}
                disabled={revokingId === invitation.id}
                aria-label={`Revoke invitation for ${invitation.email}`}
              >
                {revokingId === invitation.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Revoke
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
