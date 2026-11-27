/**
 * Self-check for the two string parsers behind logo replacement and Google
 * profile linking. Run with: pnpm tsx src/lib/parsers.check.ts
 */
import assert from "node:assert/strict"
import { LOGOS_BUCKET, logoStoragePath } from "@/lib/storage"
import { appendAmendmentNote, formatRand, isInvoiceEditable, isQuoteEditable, splitFullName } from "@/lib/utils"

const base = `https://ref.supabase.co/storage/v1/object/public/${LOGOS_BUCKET}/`

// A stale logo must be deletable, or every replacement leaks a file.
assert.equal(logoStoragePath(`${base}org-1/logo-123.png`), "org-1/logo-123.png")
assert.equal(logoStoragePath(null), null)
assert.equal(logoStoragePath(undefined), null)
assert.equal(logoStoragePath(""), null)
// Not one of ours — never hand an arbitrary path to storage.remove().
assert.equal(logoStoragePath("https://evil.example/logo.png"), null)
assert.equal(logoStoragePath(base), null)

assert.deepEqual(splitFullName("Bongani Mlumbi"), {
  first_name: "Bongani",
  last_name: "Mlumbi",
})
assert.deepEqual(splitFullName("Ann Marie van Wyk"), {
  first_name: "Ann",
  last_name: "Marie van Wyk",
})
assert.deepEqual(splitFullName("Thabo"), { first_name: "Thabo", last_name: null })
// Google can omit the name entirely; columns are nullable, so stay null.
assert.deepEqual(splitFullName(undefined), { first_name: null, last_name: null })
assert.deepEqual(splitFullName("   "), { first_name: null, last_name: null })

// Credit lines (e.g. GD6 on INV-1687) print as a minus on the PDF. The sign
// goes before the R, and must never appear on an amount that rounds to zero.
assert.equal(formatRand(35000), "R 35,000.00")
assert.equal(formatRand(-35000), "-R 35,000.00")
assert.equal(formatRand(0), "R 0.00")
assert.equal(formatRand(-0.001), "R 0.00")
assert.equal(formatRand(-1000000), "-R 1,000,000.00")
assert.equal(formatRand(-1234.5), "-R 1,234.50")
assert.equal(formatRand("694.40"), "R 694.40")
// Prisma hands these over as Decimal, not number.
assert.equal(formatRand({ toNumber: () => -35000 }), "-R 35,000.00")

// A sent invoice can still be wrong and must stay amendable; a paid one must
// not, or paid_amount silently stops matching the total.
assert.equal(isInvoiceEditable("DRAFT"), true)
assert.equal(isInvoiceEditable("SENT"), true)
assert.equal(isInvoiceEditable("OVERDUE"), true)
assert.equal(isInvoiceEditable("PAID"), false)
assert.equal(isInvoiceEditable("CANCELLED"), false)

assert.equal(isQuoteEditable("DRAFT"), true)
assert.equal(isQuoteEditable("SENT"), true)
assert.equal(isQuoteEditable("EXPIRED"), true)
assert.equal(isQuoteEditable("ACCEPTED"), false)
assert.equal(isQuoteEditable("DECLINED"), false)
// Converted quotes are locked at any status, or the quote and the invoice
// raised off it drift apart.
assert.equal(isQuoteEditable("SENT", "inv-1"), false)
assert.equal(isQuoteEditable("DRAFT", "inv-1"), false)
assert.equal(isQuoteEditable("SENT", null), true)
assert.equal(isQuoteEditable("SENT", undefined), true)

// The amendment trail appends, never replaces — losing an earlier line would
// lose the only record of what the client was originally sent.
const day = new Date("2026-11-27T10:00:00Z")
assert.equal(
  appendAmendmentNote(null, 91878.56, 56878.56, day),
  "Amended 27 Nov 2026: total R 91,878.56 → R 56,878.56",
)
assert.equal(
  appendAmendmentNote("Client queried the GD6 line", 91878.56, 56878.56, day),
  "Client queried the GD6 line\nAmended 27 Nov 2026: total R 91,878.56 → R 56,878.56",
)
assert.equal(
  appendAmendmentNote(
    appendAmendmentNote(null, 100, 90, day),
    90,
    -10,
    day,
  ),
  "Amended 27 Nov 2026: total R 100.00 → R 90.00\n" +
    "Amended 27 Nov 2026: total R 90.00 → -R 10.00",
)
// Whitespace-only notes must not leave a blank first line.
assert.equal(appendAmendmentNote("   ", 1, 2, day), "Amended 27 Nov 2026: total R 1.00 → R 2.00")

console.log("parsers.check: ok")
