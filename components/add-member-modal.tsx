"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAddMember: (email: string, role: string) => Promise<boolean>
  onInvite: (email: string, role: string) => Promise<boolean>
}

type Role = "admin" | "member"
type Mode = "existing" | "invite"

const AddMemberModal = ({
  isOpen,
  onClose,
  onAddMember,
  onInvite,
}: AddMemberModalProps) => {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("member")
  const [mode, setMode] = useState<Mode>("existing")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      const success = await (mode === "existing" ? onAddMember : onInvite)(
        email,
        role,
      )
      if (success) {
        setEmail("")
        onClose()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md space-y-2">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <Button
            type="button"
            size="sm"
            variant={mode === "existing" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setMode("existing")}
          >
            Existing user
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "invite" ? "default" : "ghost"}
            className="flex-1"
            onClick={() => setMode("invite")}
          >
            Invite by email
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              required
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {mode === "existing"
                ? "The email must already be registered on the platform."
                : "We'll email them a link to join this workspace."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger aria-label="Invitation role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member (default)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !email}>
              {isLoading
                ? mode === "existing"
                  ? "Adding..."
                  : "Sending..."
                : mode === "existing"
                  ? "Add Member"
                  : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddMemberModal
