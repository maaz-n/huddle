"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TaskStatus = "todo" | "in_progress" | "blocked" | "done"
type TaskPriority = "low" | "medium" | "high"

interface FilterBarProps {
  onFilterChange: (filters: {
    status?: TaskStatus[]
    priority?: TaskPriority[]
    assignee?: string
  }) => void
}

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

const assignees = [
  { value: "1", label: "John Doe" },
  { value: "2", label: "Jane Smith" },
  { value: "3", label: "Bob Johnson" },
]

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "">("")
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | "">("")
  const [selectedAssignee, setSelectedAssignee] = useState("")

  const handleStatusChange = (value: TaskStatus) => {
    setSelectedStatus(value)
    updateFilters(value, selectedPriority, selectedAssignee)
  }

  const handlePriorityChange = (value: TaskPriority) => {
    setSelectedPriority(value)
    updateFilters(selectedStatus, value, selectedAssignee)
  }

  const handleAssigneeChange = (value: string) => {
    setSelectedAssignee(value)
    updateFilters(selectedStatus, selectedPriority, value)
  }

  const updateFilters = (status: TaskStatus | "", priority: TaskPriority | "", assignee: string) => {
    const filters: any = {}
    if (status) filters.status = [status]
    if (priority) filters.priority = [priority]
    if (assignee) filters.assignee = assignee
    onFilterChange(filters)
  }

  const clearFilters = () => {
    setSelectedStatus("")
    setSelectedPriority("")
    setSelectedAssignee("")
    onFilterChange({})
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
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by assignee" />
        </SelectTrigger>
        <SelectContent>
          {assignees.map((assignee) => (
            <SelectItem key={assignee.value} value={assignee.value}>
              {assignee.label}
            </SelectItem>
          ))}
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
