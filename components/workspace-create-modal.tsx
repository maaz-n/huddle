"use client"

import { useState } from "react"
import { Loader2, LayoutGrid, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface WorkspaceCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateWorkspace: (name: string) => Promise<void> // Changed to Promise
}

export function WorkspaceCreateModal({ open, onOpenChange, onCreateWorkspace }: WorkspaceCreateModalProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await onCreateWorkspace(name)
      setName("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="h-2 bg-linear-to-r from-primary/50 via-primary to-primary/50" />
        
        <div className="p-8">
          <DialogHeader className="items-center text-center space-y-3 mb-8">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Create a new workspace
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-balance text-center text-base lg:text-sm">
              Workspaces are shared environments where your team can collaborate on projects and tasks.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                  Workspace Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Acme Marketing or Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-base px-4 bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                  required
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                <p className="lg:text-[11px] text-[14px] text-muted-foreground ml-1">
                  You can always change this name later in settings.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full font-semibold shadow-lg shadow-primary/20"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}