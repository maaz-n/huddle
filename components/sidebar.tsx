"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, History, LayoutDashboard, CheckSquare, Briefcase, UserIcon, Users2, PenIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWorkspaceHref } from "@/hooks/useWorkspaceHref"
import { useLocale } from "@/lib/use-locale"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const { t } = useLocale()
  const pathname = usePathname();
  const dashboardHref = useWorkspaceHref("/")
  const tasksHref = useWorkspaceHref("/tasks")
  const settingsHref = useWorkspaceHref("/settings")
  const membersHref = useWorkspaceHref("/members")
  const myTasksHref = useWorkspaceHref("/my-tasks")
  const activityHref = useWorkspaceHref("/activity")
  const profileHref = useWorkspaceHref("/profile")

  const navSections = [
    {
      title: t("nav.overview"),
      items: [
        { label: t("nav.dashboard"), href: dashboardHref, basePath: "/", icon: LayoutDashboard },
      ],
    },
    {
      title: t("nav.work"),
      items: [
        { label: t("nav.tasks"), href: tasksHref, basePath: "/tasks", icon: CheckSquare },
        { label: t("nav.myTasks"), href: myTasksHref, basePath: "/my-tasks", icon: PenIcon },
      ],
    },
    {
      title: t("nav.workspace"),
      items: [
        { label: t("nav.activity"), href: activityHref, basePath: "/activity", icon: History },
        { label: t("nav.members"), href: membersHref, basePath: "/members", icon: Users2 },
        { label: t("nav.settings"), href: settingsHref, basePath: "/settings", icon: Briefcase },
      ],
    },
    {
      title: t("nav.profile"),
      items: [
        { label: t("nav.profile"), href: profileHref, basePath: "/profile", icon: UserIcon}
      ],
    },
  ];
  
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-card transition-transform duration-300 z-50 lg:static lg:translate-x-0 lg:z-0",
          !open && "-translate-x-full",
        )}
      >
        <nav className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6">
            <img src={"/huddle.svg"} alt="Huddle" className="pt-4 mx-auto w-35 invert-85 dark:invert-0"/>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="lg:hidden"
              aria-label={t("a11y.closeNavigation")}
            >
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
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-secondary"
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                          <span className="font-medium">{item.label}</span>
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
