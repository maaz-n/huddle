"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, LayoutDashboard, CheckSquare, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWorkspaceHref } from "@/hooks/useWorkspaceHref"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const dashboardHref = useWorkspaceHref("/")
  const tasksHref = useWorkspaceHref("/tasks")

  const navItems = [
    { label: "Dashboard", href: dashboardHref, basePath: "/", icon: LayoutDashboard },
    { label: "Tasks", href: tasksHref, basePath: "/tasks", icon: CheckSquare },
    { label: "Settings", href: "/settings", basePath: "/settings", icon: Settings },
  ]

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 border-r bg-card transition-transform duration-300 z-50 lg:static lg:translate-x-0 lg:z-0",
          !open && "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-primary">OPENOPS</h1>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="lg:hidden">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.basePath
            return (
              <Link key={item.href} href={item.href}>
                <button
                  onClick={() => setOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
