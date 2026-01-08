"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { UserMenu } from "./user-menu"
import { UserType } from "@/types/types"

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void,
  user: UserType
}

export function Header({ sidebarOpen, setSidebarOpen, user }: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden lg:block">
            <WorkspaceSwitcher />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <WorkspaceSwitcher />
          </div>
          <UserMenu user={user}/>
        </div>
      </div>
    </header>
  )
}
