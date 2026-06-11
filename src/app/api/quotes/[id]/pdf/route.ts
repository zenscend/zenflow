import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { QuotePDF } from "@/components/pdf/QuotePDF"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organisationId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }

  const { id } = await params

  const [quote, organisation] = await Promise.all([
    prisma.quote.findFirst({
      where: { id, organisation_id: session.user.organisationId },
      include: { customer: true },
    }),
    prisma.organisation.findUnique({
      where: { id: session.user.organisationId },
    }),
  ])

  if (!quote || !organisation) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  }

  const rawItems = await prisma.line_item.findMany({
    where: { source: "quote", source_id: id },
    orderBy: { sort_order: "asc" },
    include: { product_line_item: true, custom_line_item: true, tax: { select: { name: true, rate: true } } },
  })

  const line_items = rawItems.map((li: any) => {
    const sub = li.product_line_item ?? li.custom_line_item
    return { ...li, description: sub?.description ?? "", unit_price: sub?.unit_price ?? 0, unit_type: sub?.unit_type ?? "item" }
  })

  const quoteWithItems = { ...quote, line_items }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(QuotePDF as any, { quote: quoteWithItems, organization: organisation }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quote_number}.pdf"`,
    },
  })
}
