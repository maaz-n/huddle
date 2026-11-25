"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { transferOwnership } from "@/actions/workspace"
import { UserWithRole } from "@/types/types"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

interface TransferOwnershipSectionProps {
  workspaceId: string
  users: UserWithRole[]
  currentUserId: string
}

function TransferOwnershipSection({
  workspaceId,
  users,
  currentUserId,
}: TransferOwnershipSectionProps) {
  const [newOwnerId, setNewOwnerId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const eligibleUsers = users.filter(
    (user) => user.id !== currentUserId && user.role !== "owner",
  )
  const newOwner = eligibleUsers.find((user) => user.id === newOwnerId)

  async function handleTransfer() {
    if (!newOwnerId) return
    try {
      setIsLoading(true)
      const response = await transferOwnership(workspaceId, newOwnerId)
      if (response.success) {
        toast.success(response.message)
        setNewOwnerId("")
        router.refresh()
      } else {
        toast.error(response.message)
      }
    } catch (error) {
      console.error(error)
      toast.error("Could not transfer ownership")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="py-12">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
        <div className="flex-none lg:w-[380px] space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Transfer Ownership
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Hand this workspace over to another member. You will become an
            admin and lose access to owner-only settings.
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border bg-card p-6 shadow-sm border-border/60 space-y-4">
            {eligibleUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                There are no other members to transfer ownership to yet.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground/70">
                    New Owner
                  </Label>
                  <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                    <SelectTrigger className="max-w-md h-11 bg-muted/20">
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 flex justify-end border-t border-border/40 mt-6">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="px-6"
                        disabled={!newOwnerId || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Transfer Ownership"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Transfer ownership to {newOwner?.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {newOwner?.name} will become the owner and you will
                          become an admin. This cannot be undone by you alone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleTransfer}>
                          Transfer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransferOwnershipSection
