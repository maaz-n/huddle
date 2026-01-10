"use client"

import { usePathname, useSearchParams } from "next/navigation"

export function useWorkspaceHref(path: string) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const workspace = searchParams.get("workspace")

  if (!workspace) return path

  return `${path}?workspace=${workspace}`
}
