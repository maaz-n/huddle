"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { getWorkspaceActivity } from "@/actions/activity"
import { ActivityLogItem } from "@/components/activity-log-item"
import { Button } from "@/components/ui/button"
import type { ActivityItem } from "@/types/types"

const PAGE_SIZE = 30

export function ActivityFeed({
  workspaceId,
  initialItems,
}: {
  workspaceId: string
  initialItems: ActivityItem[]
}) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState(false)
  const [exhausted, setExhausted] = useState(initialItems.length < PAGE_SIZE)

  async function loadMore() {
    setLoading(true)
    try {
      const next = await getWorkspaceActivity(
        workspaceId,
        PAGE_SIZE,
        items.length,
      )
      setItems((previous) => [...previous, ...next])
      setExhausted(next.length < PAGE_SIZE)
    } catch {
      setExhausted(true)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nothing has happened in this workspace yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 divide-y">
        {items.map((item) => (
          <ActivityLogItem key={item.id} log={item} />
        ))}
      </div>

      {!exhausted && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
