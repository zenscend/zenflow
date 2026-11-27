/**
 * One-off amendment to INV-1687 (Collateral Trading 280 cc / LSG Machine Tools).
 *
 *   pnpm db:fix-inv-1687            # dry run
 *   pnpm db:fix-inv-1687 --apply    # writes
 *
 * The GD6 item is goods MSS received *from* the client, so it comes off the
 * invoice. With no way to enter a negative amount it was captured as R35,000
 * at 100% discount, which prints as R 0.00 and subtracts nothing. The client
 * asked for it to show as a minus and actually reduce the total.
 *
 * The invoice is SENT and only DRAFT invoices are editable, so this writes the
 * row directly. Status is left alone.
 */
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Decimal } from "@prisma/client/runtime/client"

const ORG_ID = "fafc7fbd-5eaf-40e2-81f8-e8ae32191e2d"
const INVOICE_NUMBER = "INV-1687"
const DESCRIPTION = "GD6"
const CREDIT = -35000

/** What the amended invoice must come to. Guards against a surprise. */
const EXPECTED = { subtotal: 44894.4, vat: 11984.16, total: 56878.56 }

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

const r2 = (n: number) => Math.round(n * 100) / 100

async function main() {
  const apply = process.argv.includes("--apply")

  const invoice = await prisma.invoice.findFirst({
    where: { organisation_id: ORG_ID, invoice_number: INVOICE_NUMBER },
    select: { id: true, status: true, subtotal: true, vat_amount: true, total: true },
  })
  if (!invoice) throw new Error(`${INVOICE_NUMBER} not found`)

  const items = await prisma.line_item.findMany({
    where: { source: "invoice", source_id: invoice.id },
    orderBy: { sort_order: "asc" },
    include: { custom_line_item: true, product_line_item: true, tax: true },
  })

  // Match on description, not the uuid, so a second run is a no-op.
  const target = items.find(
    (li) => (li.custom_line_item ?? li.product_line_item)?.description.trim() === DESCRIPTION,
  )
  if (!target) throw new Error(`No "${DESCRIPTION}" line on ${INVOICE_NUMBER}`)
  if (!target.custom_line_item) throw new Error(`"${DESCRIPTION}" is a product line; expected a custom line`)

  const taxRate = Number(target.tax.rate)
  const lineTotal = r2(Number(target.quantity) * CREDIT) // discount goes to 0
  const taxAmount = r2(lineTotal * taxRate)

  // Totals are summed from the rows actually in the DB, not transcribed, so a
  // stale assumption about the other nine lines cannot be baked in.
  let subtotal = 0
  let vat = 0
  for (const li of items) {
    const isTarget = li.id === target.id
    subtotal += isTarget ? lineTotal : Number(li.line_total)
    vat += isTarget ? taxAmount : Number(li.tax_amount)
  }
  subtotal = r2(subtotal)
  vat = r2(vat)
  const total = r2(subtotal + vat)

  const done = Number(target.custom_line_item.unit_price) === CREDIT

  console.log(`${INVOICE_NUMBER} (${invoice.status}) — ${items.length} line items`)
  console.log(`\n  "${DESCRIPTION}" line ${target.id}  [tax: ${target.tax.name} @ ${taxRate}]`)
  console.log(`    unit_price  ${target.custom_line_item.unit_price} → ${CREDIT.toFixed(2)}`)
  console.log(`    discount    ${target.discount} → 0.00`)
  console.log(`    line_total  ${target.line_total} → ${lineTotal.toFixed(2)}`)
  console.log(`    tax_amount  ${target.tax_amount} → ${taxAmount.toFixed(2)}`)
  console.log(`\n  invoice totals`)
  console.log(`    subtotal    ${invoice.subtotal} → ${subtotal.toFixed(2)}`)
  console.log(`    vat_amount  ${invoice.vat_amount} → ${vat.toFixed(2)}`)
  console.log(`    total       ${invoice.total} → ${total.toFixed(2)}`)

  if (done) {
    console.log("\nalready correct, nothing to do.")
    return
  }

  if (subtotal !== EXPECTED.subtotal || vat !== EXPECTED.vat || total !== EXPECTED.total) {
    throw new Error(
      `Recomputed totals ${subtotal}/${vat}/${total} do not match the expected ` +
        `${EXPECTED.subtotal}/${EXPECTED.vat}/${EXPECTED.total}. Refusing to write — ` +
        `the invoice has changed since this fix was written.`,
    )
  }

  if (!apply) {
    console.log("\ndry run — nothing written. Re-run with --apply to commit.")
    return
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.custom_line_item.update({
      where: { line_item_id: target.id },
      data: { unit_price: new Decimal(CREDIT) },
    })
    await tx.line_item.update({
      where: { id: target.id },
      data: {
        discount: new Decimal(0),
        line_total: new Decimal(lineTotal),
        tax_amount: new Decimal(taxAmount),
      },
    })
    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        subtotal: new Decimal(subtotal),
        vat_amount: new Decimal(vat),
        total: new Decimal(total),
      },
    })
  })

  console.log("\n✓ applied")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
