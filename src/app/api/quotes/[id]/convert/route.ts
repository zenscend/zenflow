import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addDays } from "@/lib/utils"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params

  const quote = await prisma.quote.findFirst({
    where: { id, organisation_id: session.user.organisationId },
  })

  if (!quote) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  if (quote.converted_to_invoice_id) return NextResponse.json({ error: { code: "ALREADY_CONVERTED", message: "This quote has already been converted to an invoice" } }, { status: 409 })
  if (!["DRAFT", "SENT", "ACCEPTED"].includes(quote.status)) {
    return NextResponse.json({ error: { code: "INVALID_STATUS", message: "Only DRAFT, SENT, or ACCEPTED quotes can be converted" } }, { status: 409 })
  }

  const quoteLineItems = await prisma.line_item.findMany({
    where: { source: "quote", source_id: id },
    orderBy: { sort_order: "asc" },
    include: { product_line_item: true, custom_line_item: true },
  })

  const invoice = await prisma.$transaction(async (tx: any) => {
    const org = await tx.organisation.update({
      where: { id: session.user.organisationId! },
      data: { next_invoice_no: { increment: 1 } },
      select: { next_invoice_no: true, invoice_prefix: true, default_payment_terms_days: true },
    })

    const invoiceNumber = `${org.invoice_prefix}-${String(org.next_invoice_no - 1).padStart(4, "0")}`
    const issueDate = new Date()
    const dueDate = addDays(issueDate, org.default_payment_terms_days)

    const inv = await tx.invoice.create({
      data: {
        organisation_id: session.user.organisationId!,
        customer_id: quote.customer_id,
        invoice_number: invoiceNumber,
        quote_id: quote.id,
        title: quote.title,
        notes: quote.notes,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: quote.subtotal,
        vat_amount: quote.vat_amount,
        total: quote.total,
      },
    })

    for (const item of quoteLineItems) {
      const li = await tx.line_item.create({
        data: {
          source: "invoice",
          source_id: inv.id,
          tax_id: item.tax_id,
          type: item.type,
          quantity: item.quantity,
          discount: item.discount,
          line_total: item.line_total,
          tax_amount: item.tax_amount,
          sort_order: item.sort_order,
        },
      })
      if (item.product_line_item) {
        await tx.product_line_item.create({
          data: {
            line_item_id: li.id,
            product_id: item.product_line_item.product_id,
            description: item.product_line_item.description,
            unit_price: item.product_line_item.unit_price,
            unit_type: item.product_line_item.unit_type,
          },
        })
      } else if (item.custom_line_item) {
        await tx.custom_line_item.create({
          data: {
            line_item_id: li.id,
            description: item.custom_line_item.description,
            unit_price: item.custom_line_item.unit_price,
            unit_type: item.custom_line_item.unit_type,
          },
        })
      }
    }

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
