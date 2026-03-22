import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

export function formatCurrency(
  amount: number | string | { toNumber: () => number },
  currency = "USD",
  locale = "en-US"
): string {
  const value =
    typeof amount === "object" && "toNumber" in amount
      ? amount.toNumber()
      : Number(amount);
  const key = `${locale}-${currency}`;
  if (!currencyFormatterCache.has(key)) {
    currencyFormatterCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  return currencyFormatterCache.get(key)!.format(value);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const key = JSON.stringify(options ?? "default");
  if (!dateFormatterCache.has(key)) {
    dateFormatterCache.set(
      key,
      new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...options,
      })
    );
  }
  return dateFormatterCache.get(key)!.format(d);
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function formatCompactNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Returns a human-readable date group label:
 * "Today", "Yesterday", weekday name (within 7 days), or "Mar 15" / "Mar 15, 2023"
 */
export function getDateLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/**
 * Groups an array of items (each with a `date` field) by their getDateLabel value.
 * Preserves the order of first occurrence.
 */
export function groupByDate<T extends { date: Date | string }>(
  items: T[]
): { label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const label = getDateLabel(item.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return Array.from(map.entries()).map(([label, groupItems]) => ({
    label,
    items: groupItems,
  }));
}

