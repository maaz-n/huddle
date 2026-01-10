"use client"

import { UserType, Workspace } from "@/types/types"
import { createContext, useContext } from "react"

const AppDataContext = createContext<any>(null)

export const AppDataProvider = ({
  user,
  workspaces,
  children,
}: {
  user: UserType
  workspaces: Workspace[]
  children: React.ReactNode
}) => {
  return (
    <AppDataContext.Provider value={{ user, workspaces }}>
      {children}
    </AppDataContext.Provider>
  )
}

export const useAppData = () => {
  return useContext(AppDataContext)
}
