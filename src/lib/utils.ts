import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatZAR(amount: number | string | { toNumber(): number }): string {
  const value = typeof amount === "object" ? amount.toNumber() : Number(amount)
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(value)
}

/**
 * Money for the PDFs: "R 35,000.00", "-R 35,000.00".
 *
 * Distinct from formatZAR, which is the locale-aware on-screen format
 * ("R 35 000,00"). Every invoice MSS has sent uses this style, so the two
 * cannot be collapsed without restyling every amount on every document.
 */
export function formatRand(amount: number | string | { toNumber(): number }): string {
  const n = typeof amount === "object" && amount !== null && "toNumber" in amount
    ? amount.toNumber()
    : Number(amount)
  const rounded = Math.round(n * 100) / 100 // so -0.001 prints "R 0.00", not "-R 0.00"
  const grouped = Math.abs(rounded).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return (rounded < 0 ? "-R " : "R ") + grouped
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "d MMMM yyyy")
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy")
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Splits a Google `full_name` into our first/last name columns. */
export function splitFullName(fullName: unknown): {
  first_name: string | null
  last_name: string | null
} {
  const [first, ...rest] = String(fullName ?? "").trim().split(/\s+/)
  return { first_name: first || null, last_name: rest.join(" ") || null }
}
