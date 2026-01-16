"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WorkspaceWithRole } from "@/types/types"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

const roleStyles = {
  owner: "bg-yellow-100 text-yellow-800",
  admin: "bg-blue-100 text-blue-800",
  member: "bg-gray-100 text-gray-800",
}

export function WorkspaceSwitcher({ workspaces }: { workspaces: WorkspaceWithRole[] }) {

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { push } = useRouter();
  const workspaceIdFromUrl = searchParams.get("workspace");

  const activeWorkspace = workspaces.find(w => w.workspaceId === workspaceIdFromUrl) 
    || workspaces[0] 
    || null;

  useEffect(() => {
    if (workspaces.length > 0 && !workspaceIdFromUrl) {
      const params = new URLSearchParams(searchParams);
      params.set("workspace", workspaces[0].workspaceId);
      push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [workspaces, workspaceIdFromUrl, pathname, push]);

  if (!activeWorkspace) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          {activeWorkspace.workspaceName}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.workspaceId}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("workspace", workspace.workspaceId);
              push(`${pathname}?${params.toString()}`);
            }}
            className={activeWorkspace.workspaceId === workspace.workspaceId ? "bg-secondary" : ""}
          >
            <div className="flex w-full items-center justify-between">
              <span>{workspace.workspaceName}</span>

              <span className={`text-xs px-2 py-0.5 rounded capitalize ${roleStyles[workspace.role]}`}>
                {workspace.role}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
