import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addDays } from "@/lib/utils"
import { Decimal } from "@prisma/client/runtime/client"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const quote = await prisma.quote.findFirst({
    where: { id, organization_id: session.user.organizationId },
    include: { line_items: { orderBy: { sort_order: "asc" } } },
  })

  if (!quote) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  if (quote.converted_to_invoice_id) return NextResponse.json({ error: { code: "ALREADY_CONVERTED", message: "This quote has already been converted to an invoice" } }, { status: 409 })
  if (!["DRAFT", "SENT", "ACCEPTED"].includes(quote.status)) {
    return NextResponse.json({ error: { code: "INVALID_STATUS", message: "Only DRAFT, SENT, or ACCEPTED quotes can be converted" } }, { status: 409 })
  }

  const invoice = await prisma.$transaction(async (tx: any) => {
    // Atomically get invoice number
    const org = await tx.organization.update({
      where: { id: session.user.organizationId! },
      data: { next_invoice_no: { increment: 1 } },
      select: { next_invoice_no: true, invoice_prefix: true, default_payment_terms_days: true },
    })

    const invoiceNumber = `${org.invoice_prefix}-${String(org.next_invoice_no - 1).padStart(4, "0")}`
    const issueDate = new Date()
    const dueDate = addDays(issueDate, org.default_payment_terms_days)

    const inv = await tx.invoice.create({
      data: {
        organization_id: session.user.organizationId!,
        customer_id: quote.customer_id,
        invoice_number: invoiceNumber,
        source_quote_id: quote.id,
        title: quote.title,
        notes: quote.notes,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: quote.subtotal,
        vat_amount: quote.vat_amount,
        total: quote.total,
        line_items: {
          create: quote.line_items.map((item: any) => ({
            product_id: item.product_id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit_type: item.unit_type,
            is_taxable: item.is_taxable,
            discount: item.discount,
            line_total: item.line_total,
            vat_amount: item.vat_amount,
            sort_order: item.sort_order,
          })),
        },
      },
    })

    // Link quote to invoice and mark accepted
    await tx.quote.update({
      where: { id: quote.id },
      data: {
        status: "ACCEPTED",
        converted_to_invoice_id: inv.id,
      },
    })

    return inv
  })

  return NextResponse.json({ data: invoice }, { status: 201 })
}
