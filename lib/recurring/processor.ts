import type { RecurringFrequency } from "@/lib/generated/prisma/enums";

/**
 * Computes the next due date given a base date and frequency.
 * Pure function — no side effects.
 */
export function computeNextDueDate(
  from: Date,
  frequency: RecurringFrequency
): Date {
  const d = new Date(from);
  switch (frequency) {
    case "DAILY":
      d.setDate(d.getDate() + 1);
      break;
    case "WEEKLY":
      d.setDate(d.getDate() + 7);
      break;
    case "BIWEEKLY":
      d.setDate(d.getDate() + 14);
      break;
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      break;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

/**
 * Determines if a recurring rule is due on or before `asOf`.
 */
export function isDue(nextDueDate: Date, asOf: Date = new Date()): boolean {
  return nextDueDate <= asOf;
}
