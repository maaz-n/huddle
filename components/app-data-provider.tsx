"use client"

import { UserTypeNew, WorkspaceWithRole } from "@/types/types"
import { createContext, useContext } from "react"

type AppData = {
  user: UserTypeNew
  workspaces: WorkspaceWithRole[]
}

const AppDataContext = createContext<AppData | null>(null)

export const AppDataProvider = ({
  user,
  workspaces,
  children,
}: {
  user: UserTypeNew
  workspaces: WorkspaceWithRole[]
  children: React.ReactNode
}) => {
  return (
    <AppDataContext.Provider value={{ user, workspaces }}>
      {children}
    </AppDataContext.Provider>
  )
}

export const useAppData = () => {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider")
  }
  return context
}
