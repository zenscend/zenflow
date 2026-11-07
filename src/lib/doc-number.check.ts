/**
 * Self-check for quote/invoice numbering. Run with: pnpm tsx src/lib/doc-number.check.ts
 *
 * The case that broke production: numbers edited by hand in the DB leave the
 * org counter pointing at a number that already exists, so every create trips
 * the (organisation_id, number) unique index.
 */
import assert from "node:assert/strict"
import { nextDocNumber } from "@/lib/doc-number"

/** Minimal stand-in for the Prisma transaction client. */
function stubTx(counter: number, existing: string[], kind: "quote" | "invoice" = "quote") {
  const counterField = kind === "quote" ? "next_quote_no" : "next_invoice_no"
  const prefixField = kind === "quote" ? "quote_prefix" : "invoice_prefix"
  const numberField = `${kind}_number`
  const org: any = { id: "org-1", [prefixField]: kind === "quote" ? "QUO" : "INV", [counterField]: counter }

  return {
    organisation: {
      async update({ data }: any) {
        const d = data[counterField]
        org[counterField] = typeof d === "object" ? org[counterField] + d.increment : d
        return { ...org }
      },
    },
    [kind]: {
      async findFirst() {
        const sorted = [...existing].sort()
        const top = sorted[sorted.length - 1]
        return top ? { [numberField]: top } : null
      },
    },
    org,
  }
}

async function main() {
  // Counter ahead of every existing number — use it as-is.
  let tx = stubTx(8, ["QUO-0001", "QUO-0007"])
  assert.equal((await nextDocNumber(tx, "org-1", "quote")).number, "QUO-0008")
  assert.equal(tx.org.next_quote_no, 9)

  // The production bug: counter collides with a hand-edited number. Skip past
  // the highest in use and leave the counter repaired, not stuck.
  tx = stubTx(10, ["QUO-0001", "QUO-0009", "QUO-0014"])
  assert.equal((await nextDocNumber(tx, "org-1", "quote")).number, "QUO-0015")
  assert.equal(tx.org.next_quote_no, 16)

  // Counter equal to the highest in use is still a collision.
  tx = stubTx(14, ["QUO-0014"])
  assert.equal((await nextDocNumber(tx, "org-1", "quote")).number, "QUO-0015")

  // First document for a brand new org.
  tx = stubTx(1, [])
  assert.equal((await nextDocNumber(tx, "org-1", "quote")).number, "QUO-0001")
  assert.equal(tx.org.next_quote_no, 2)

  // A number that isn't ours at all must not become NaN and wedge creation.
  tx = stubTx(3, ["QUO-draft"])
  assert.equal((await nextDocNumber(tx, "org-1", "quote")).number, "QUO-0003")

  // Invoices run the same path off their own counter and prefix.
  tx = stubTx(2, ["INV-0005"], "invoice")
  assert.equal((await nextDocNumber(tx, "org-1", "invoice")).number, "INV-0006")
  assert.equal(tx.org.next_invoice_no, 7)

  console.log("doc-number.check: ok")
}

main()
