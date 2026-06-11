import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvoicePDF } from "@/components/pdf/InvoicePDF"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organisationId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }

  const { id } = await params

  const [invoice, organisation] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, organisation_id: session.user.organisationId },
      include: { customer: true },
    }),
    prisma.organisation.findUnique({
      where: { id: session.user.organisationId },
    }),
  ])

  if (!invoice || !organisation) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  }

  const rawItems = await prisma.line_item.findMany({
    where: { source: "invoice", source_id: id },
    orderBy: { sort_order: "asc" },
    include: { product_line_item: true, custom_line_item: true, tax: { select: { name: true, rate: true } } },
  })

  const line_items = rawItems.map((li: any) => {
    const sub = li.product_line_item ?? li.custom_line_item
    return { ...li, description: sub?.description ?? "", unit_price: sub?.unit_price ?? 0, unit_type: sub?.unit_type ?? "item" }
  })

  const invoiceWithItems = { ...invoice, line_items }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF as any, { invoice: invoiceWithItems, organization: organisation }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
