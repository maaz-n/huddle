"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { useLocale } from "@/lib/use-locale"

interface AppLayoutProps {
  children: React.ReactNode,
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLocale();

  return (
    <div className="flex h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        {t("a11y.skip")}
      </a>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main id="main-content" className="flex-1 overflow-y-auto border-l" tabIndex={-1}>
          <div className="container mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
