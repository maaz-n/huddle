"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { UserTypeNew } from "@/types/types"

type TaskStatus = "todo" | "in_progress" | "blocked" | "done"
type TaskPriority = "low" | "medium" | "high"

const statuses: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
]

const priorities: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

export function FilterBar({users}: {users: UserTypeNew[]}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "">("")
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | "">("")
  const [selectedAssignee, setSelectedAssignee] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (selectedStatus) {
      params.set("status", selectedStatus)
    } else {
      params.delete("status")
    }

    if (selectedPriority) {
      params.set("priority", selectedPriority)
    } else {
      params.delete("priority")
    }

    if (selectedAssignee) {
      params.set("assignee", selectedAssignee)
    } else {
      params.delete("assignee")
    }

    replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [
    selectedStatus,
    selectedPriority,
    selectedAssignee,
  ])

  const handleStatusChange = (value: TaskStatus) => {
    setSelectedStatus(value)
  }

  const handlePriorityChange = (value: TaskPriority) => {
    setSelectedPriority(value)
  }

  const handleAssigneeChange = (value: string) => {
    setSelectedAssignee(value)
  }

  const clearFilters = () => {
    setSelectedStatus("")
    setSelectedPriority("")
    setSelectedAssignee("");
  }

  const hasFilters = selectedStatus || selectedPriority || selectedAssignee

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={selectedStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedPriority} onValueChange={handlePriorityChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by priority" />
        </SelectTrigger>
        <SelectContent>
          {priorities.map((priority) => (
            <SelectItem key={priority.value} value={priority.value}>
              {priority.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedAssignee} onValueChange={handleAssigneeChange}>
        <SelectTrigger className="w-40" disabled={users.length == 0}>
          <SelectValue placeholder="Filter by assignee" />
        </SelectTrigger>
        <SelectContent>
          { users.length>0 && 
          users.map((admin) => (
            admin && <SelectItem key={admin.id} value={admin.id}>
              {admin.name}
            </SelectItem>
          ))
          }
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1 bg-transparent">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
