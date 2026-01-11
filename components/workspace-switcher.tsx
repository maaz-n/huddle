"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Workspace } from "@/types/types"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

export function WorkspaceSwitcher({ workspaces }: { workspaces: Workspace[] }) {

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();
  const [currentWorkspace, setCurrentWorkspace] = useState(() => {
    const workspaceId = searchParams.get("workspace");
    return workspaces.find(w => w.id === workspaceId) || workspaces[0];
  });


  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set("workspace", currentWorkspace.id)
    push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [currentWorkspace])

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
