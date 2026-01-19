"use client"

import { Menu, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { UserMenu } from "./user-menu"
import { useAppData } from "./app-data-provider"
import { ModeToggle } from "./theme-toggle"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { WorkspaceCreateModal } from "./workspace-create-modal"
import { createWorkspace } from "@/actions/workspace"

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void,
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {

  const { user, workspaces } = useAppData();
  const router = useRouter();
  const [workspaceCreateOpen, setWorkspaceCreateOpen] = useState(false);

  const handleCreateWorkspace = async (name: string) => {
    try {
      const response = await createWorkspace(name);

      if (response.success) {
        toast.success(response.message);
        router.refresh();
      } else {
        toast.error(response.message);
      }

    } catch (error) {
      console.error(error);
    }
  }

  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden lg:flex items-center gap-2">
            <WorkspaceSwitcher workspaces={workspaces} />
            <Button onClick={() => setWorkspaceCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-2 w-2" />
            </Button>
            
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <WorkspaceSwitcher workspaces={workspaces} />
            <Button onClick={() => setWorkspaceCreateOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-2 w-2" />
            </Button>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <ModeToggle />
            <UserMenu user={user} />
          </div>
        </div>
      </div>
      <WorkspaceCreateModal open={workspaceCreateOpen} onOpenChange={setWorkspaceCreateOpen} onCreateWorkspace={handleCreateWorkspace} />
    </header>
  )
}
