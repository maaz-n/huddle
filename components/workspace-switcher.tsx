"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Workspace } from "@/types/types"

const workspaces = [
  { id: "1", name: "Engineering" },
  { id: "2", name: "Product" },
  { id: "3", name: "Marketing" },
]

export function WorkspaceSwitcher({workspaces}: {workspaces: Workspace[]}) {
  const [currentWorkspace, setCurrentWorkspace] = useState(workspaces[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          {currentWorkspace.name}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => setCurrentWorkspace(workspace)}
            className={currentWorkspace.id === workspace.id ? "bg-secondary" : ""}
          >
            {workspace.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
