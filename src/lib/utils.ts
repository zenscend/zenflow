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

/**
 * Invoices that can still be edited. SENT and OVERDUE are amendable because a
 * bill that has gone out can still be wrong (see INV-1687); OVERDUE is only
 * SENT past its due date, so locking it would make an invoice stop being
 * editable on the day it falls due. PAID and CANCELLED stay locked — editing
 * those would desync the recorded paid_amount from the total.
 */
export const EDITABLE_INVOICE_STATUSES = ["DRAFT", "SENT", "OVERDUE"]

export function isInvoiceEditable(status: string): boolean {
  return EDITABLE_INVOICE_STATUSES.includes(status)
}

/**
 * The quote equivalent. EXPIRED mirrors OVERDUE — a lapsed quote can still be
 * corrected and re-sent. ACCEPTED and DECLINED are locked: the customer has
 * answered the document as it stood.
 */
export const EDITABLE_QUOTE_STATUSES = ["DRAFT", "SENT", "EXPIRED"]

/**
 * A quote can be converted to an invoice while still DRAFT or SENT. Once it
 * has been, editing it would leave the quote saying something different from
 * the invoice raised off it, so converted quotes are locked whatever their
 * status.
 */
export function isQuoteEditable(status: string, convertedToInvoiceId?: string | null): boolean {
  return EDITABLE_QUOTE_STATUSES.includes(status) && !convertedToInvoiceId
}

/**
 * Amending an invoice that is already with the client overwrites what they
 * were sent, so leave a line in internal_notes saying what moved. Never
 * printed on the PDF — only `notes` is.
 */
export function appendAmendmentNote(
  internalNotes: string | null | undefined,
  prevTotal: number,
  newTotal: number,
  when: Date = new Date(),
): string {
  const line = `Amended ${format(when, "d MMM yyyy")}: total ${formatRand(prevTotal)} → ${formatRand(newTotal)}`
  const existing = internalNotes?.trim()
  return existing ? `${existing}\n${line}` : line
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
