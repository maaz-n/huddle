"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { taskSortSchema, taskStatusSchema, taskPrioritySchema } from "@/lib/validation"
import { UserTypeNew } from "@/types/types"

type TaskStatus = "todo" | "in_review" | "done"
type TaskPriority = "low" | "medium" | "high"
type TaskSort = "updated" | "due" | "priority" | "title"

const statuses: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
]

const priorities: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const sorts: { value: TaskSort; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "due", label: "Due soon" },
  { value: "priority", label: "Priority: high first" },
  { value: "title", label: "Title: A to Z" },
]

export function FilterBar({ users }: { users: UserTypeNew[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter()
  const mounted = useRef(false)

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "">(
    taskStatusSchema.safeParse(searchParams.get("status")).data ?? "",
  )
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | "">(
    taskPrioritySchema.safeParse(searchParams.get("priority")).data ?? "",
  )
  const [selectedAssignee, setSelectedAssignee] = useState(
    searchParams.get("assignee") ?? "",
  )
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "")
  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [sort, setSort] = useState<TaskSort>(
    taskSortSchema.safeParse(searchParams.get("sort")).data ?? "updated",
  )

  // Debounce typing so a search does not trigger a server render per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    // The first render already mirrors the URL; don't strip an incoming page
    // parameter before the user changes a filter.
    if (!mounted.current) {
      mounted.current = true
      return
    }

    const params = new URLSearchParams(searchParams.toString())

    if (selectedStatus) params.set("status", selectedStatus)
    else params.delete("status")

    if (selectedPriority) params.set("priority", selectedPriority)
    else params.delete("priority")

    if (selectedAssignee) params.set("assignee", selectedAssignee)
    else params.delete("assignee")

    if (search) params.set("search", search)
    else params.delete("search")

    if (sort !== "updated") params.set("sort", sort)
    else params.delete("sort")

    // Changing a filter invalidates the current page.
    params.delete("page")

    replace(`${pathname}?${params.toString()}`, { scroll: false })
    // searchParams is read at render time only: reacting to its changes here
    // would immediately strip the page parameter after paging.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedStatus,
    selectedPriority,
    selectedAssignee,
    search,
    sort,
  ])

  const clearFilters = () => {
    setSelectedStatus("")
    setSelectedPriority("")
    setSelectedAssignee("")
    setSearchInput("")
    setSearch("")
    setSort("updated")
  }

  const hasFilters = Boolean(
    selectedStatus || selectedPriority || selectedAssignee || search || sort !== "updated",
  )

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative min-w-52 flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by title..."
          className="pl-9"
          aria-label="Search tasks by title"
        />
      </div>

      <Select value={sort} onValueChange={(value) => setSort(value as TaskSort)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sorts.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TaskStatus)}>
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

      <Select value={selectedPriority} onValueChange={(value) => setSelectedPriority(value as TaskPriority)}>
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

      <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
        <SelectTrigger className="w-45" disabled={users.length === 0}>
          <SelectValue placeholder="Filter by assignee" />
        </SelectTrigger>
        <SelectContent>
          {users.map((person) => (
            <SelectItem key={person.id} value={person.id}>
              {person.name}
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
