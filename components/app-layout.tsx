"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { useAppData } from "./app-data-provider"

interface AppLayoutProps {
  children: React.ReactNode,
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { user, workspaces } = useAppData()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} workspaces={workspaces}/>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
