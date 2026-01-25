"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskBadge } from "./task-badge"

interface TaskStatusCardProps {
  title: string
  count: number
  status: "todo" | "in_review" | "done"
}

export function TaskStatusCard({ title, count, status }: TaskStatusCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold">{count}</div>
          </div>
          <TaskBadge type="status" value={status} />
        </div>
      </CardContent>
    </Card>
  )
}
