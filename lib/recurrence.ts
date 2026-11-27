import type { Recurrence } from "@/types/types";

export const RECURRENCE_OPTIONS: {
  value: Recurrence;
  label: string;
}[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/**
 * Returns the first due date after `dueDate` that is also in the future.
 * Calculation is in UTC so daylight-saving shifts cannot skip or repeat a day.
 */
export function getNextDueDate(
  dueDate: string,
  recurrence: Recurrence,
  now: Date = new Date(),
): string | null {
  if (recurrence === "none") return null;

  const next = new Date(dueDate);
  if (Number.isNaN(next.getTime())) return null;

  const dayOfMonth = next.getUTCDate();

  for (let attempt = 0; attempt < 367; attempt++) {
    if (recurrence === "daily") {
      next.setUTCDate(next.getUTCDate() + 1);
    } else if (recurrence === "weekly") {
      next.setUTCDate(next.getUTCDate() + 7);
    } else {
      const year = next.getUTCFullYear();
      const month = next.getUTCMonth();
      next.setUTCDate(1);
      next.setUTCMonth(month + 1);
      next.setUTCDate(Math.min(dayOfMonth, daysInMonth(next.getUTCFullYear(), next.getUTCMonth())));
      // A narrow year guard keeps the helper from looping forever on bad input.
      if (next.getUTCFullYear() > year + 2) return null;
    }

    if (next.getTime() > now.getTime()) {
      return next.toISOString();
    }
  }

  return null;
}
