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
