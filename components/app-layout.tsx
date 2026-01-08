"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { UserType } from "@/types/types"

interface AppLayoutProps {
  children: React.ReactNode,
  user: UserType
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user}/>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
