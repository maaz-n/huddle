"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, LayoutDashboard, CheckSquare, Briefcase, UserIcon, Users2, PenIcon } from "lucide-react"
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
  const settingsHref = useWorkspaceHref("/settings")
  const membersHref = useWorkspaceHref("/members")
  const myTasksHref = useWorkspaceHref("/my-tasks")

  const navSections = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: dashboardHref, basePath: "/", icon: LayoutDashboard },
      ],
    },
    {
      title: "Work",
      items: [
        { label: "Tasks", href: tasksHref, basePath: "/tasks", icon: CheckSquare },
        { label: "My Tasks", href: myTasksHref, basePath: "/my-tasks", icon: PenIcon },
      ],
    },
    {
      title: "Workspace",
      items: [
        { label: "Members", href: membersHref, basePath: "/members", icon: Users2 },
        { label: "Workspace Settings", href: settingsHref, basePath: "/settings", icon: Briefcase },
      ],
    },
    {
      title: "Profile",
      items: [
        { label: "Profile", href: "/profile", basePath: "/profile", icon: UserIcon}
      ],
    },
  ];
  
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 border-r bg-card transition-transform duration-300 z-50 lg:static lg:translate-x-0 lg:z-0",
          !open && "-translate-x-full",
        )}
      >
        <nav className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <h1 className="text-xl font-bold text-primary mx-auto">OPENOPS</h1>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="lg:hidden">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="links-wrapper flex flex-col justify-between px-2 py-6 h-full">
            <div className="flex flex-col gap-6">
              {navSections.map((section) => (
                <div key={section.title} className="flex flex-col gap-2">
                  <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {section.title}
                  </p>

                  <div className="flex flex-col gap-3">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.basePath

                      return (
                        <Link key={item.href} href={item.href}>
                          <button
                            onClick={() => setOpen(false)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-secondary"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}
