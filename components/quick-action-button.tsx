"use client"

import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface QuickActionButtonProps {
  icon?: LucideIcon
  label: string
}

export function QuickActionButton({ icon: Icon, label, ...props }: QuickActionButtonProps) {
  return (
    <Button className="gap-2" {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Button>
  )
}
