import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { LabelColor, LabelItem } from "@/types/types"

export const labelColorClasses: Record<LabelColor, string> = {
  slate:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  red:
    "border-red-200 bg-red-100 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  amber:
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  green:
    "border-green-200 bg-green-100 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300",
  blue:
    "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  violet:
    "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
}

export function LabelChip({
  label,
  onRemove,
}: {
  label: LabelItem
  onRemove?: () => void
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        labelColorClasses[label.color],
      )}
    >
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove label ${label.name}`}
          className="rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
