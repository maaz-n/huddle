"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { useLocale } from "@/lib/use-locale"
import { useAppData } from "./app-data-provider"
import { resetDemo } from "@/actions/demo"
import { Button } from "./ui/button"
import { Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface AppLayoutProps {
  children: React.ReactNode,
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const { t } = useLocale();
  const { user } = useAppData();

  const handleResetDemo = async () => {
    setResettingDemo(true)
    try {
      const response = await resetDemo()
      if (response.success) {
        toast.success(response.message)
        window.location.reload()
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Could not reset the demo")
    } finally {
      setResettingDemo(false)
    }
  }

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
          {user?.isDemo && (
            <div className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
              <p className="font-medium text-primary">
                Demo mode - explore freely. Your changes are temporary.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetDemo}
                disabled={resettingDemo}
              >
                {resettingDemo ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Reset demo
              </Button>
            </div>
          )}
          <div className="container mx-auto h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
