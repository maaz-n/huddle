"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { InsertTask, Workspace } from "@/types/types"

interface TaskCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateWorkspace: (name: string) => void
}

export function WorkspaceCreateModal({ open, onOpenChange, onCreateWorkspace }: TaskCreateModalProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateWorkspace(name)
    setName("");
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Name</Label>
            <Input
              id="name"
              placeholder="Workspace Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Workspace</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
