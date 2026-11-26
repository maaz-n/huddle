"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  BellOff,
  Building2,
  CheckCheck,
  CheckCircle2,
  Loader2,
  MessageSquare,
  MessageSquareWarning,
  Send,
  ShieldCheck,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/actions/notifications"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { NotificationItem, NotificationType } from "@/types/types"

const ICONS: Record<NotificationType, LucideIcon> = {
  task_assigned: UserPlus,
  task_submitted: Send,
  task_completed: CheckCircle2,
  changes_requested: MessageSquareWarning,
  task_comment: MessageSquare,
  workspace_added: Building2,
  role_changed: ShieldCheck,
  invitation_accepted: UserCheck,
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const router = useRouter()

  const refreshUnread = useCallback(async () => {
    try {
      setUnread(await getUnreadNotificationCount())
    } catch {
      // Keep the previous count if the refresh fails.
    }
  }, [])

  useEffect(() => {
    const refresh = () => {
      getUnreadNotificationCount()
        .then(setUnread)
        .catch(() => {
          // Keep the previous count if the refresh fails.
        })
    }

    refresh()
    const interval = setInterval(refresh, 60_000)
    return () => clearInterval(interval)
  }, [])

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await getNotifications(15))
      await refreshUnread()
    } catch {
      toast.error("Could not load notifications")
    } finally {
      setLoading(false)
    }
  }, [refreshUnread])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      loadItems()
    }
  }

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.readAt) {
      setItems((previous) =>
        previous.map((entry) =>
          entry.id === item.id
            ? { ...entry, readAt: new Date().toISOString() }
            : entry,
        ),
      )
      setUnread((previous) => Math.max(0, previous - 1))
      try {
        await markNotificationRead(item.id)
      } catch {
        // The optimistic update is harmless if the write fails.
      }
    }

    setOpen(false)
    router.push(`/?workspace=${item.workspaceId}`)
  }

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      const response = await markAllNotificationsRead()
      if (!response.success) {
        toast.error(response.message)
        return
      }

      const readAt = new Date().toISOString()
      setItems((previous) =>
        previous.map((entry) => ({ ...entry, readAt: entry.readAt ?? readAt })),
      )
      setUnread(0)
    } catch {
      toast.error("Could not mark notifications as read")
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unread > 0 ? `Notifications (${unread} unread)` : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={handleMarkAll}
            disabled={unread === 0 || markingAll}
          >
            {markingAll ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CheckCheck className="size-3" />
            )}
            Mark all read
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <BellOff className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground">
                New assignments and review updates will show up here.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const Icon = ICONS[item.type]

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/60",
                    !item.readAt && "bg-muted/40",
                  )}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-tight">
                        {item.title}
                      </span>
                      {!item.readAt && (
                        <span
                          className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      )}
                    </span>
                    {item.body && (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {item.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
