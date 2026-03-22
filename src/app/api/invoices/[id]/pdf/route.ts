import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvoicePDF } from "@/components/pdf/InvoicePDF"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }

  const { id } = await params

  const [invoice, organization] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, organization_id: session.user.organizationId },
      include: {
        line_items: { orderBy: { sort_order: "asc" } },
        customer: true,
      },
    }),
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    }),
  ])

  if (!invoice || !organization) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(InvoicePDF as any, { invoice, organization }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
