import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import React from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { QuotePDF } from "@/components/pdf/QuotePDF"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }

  const { id } = await params

  const [quote, organization] = await Promise.all([
    prisma.quote.findFirst({
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

  if (!quote || !organization) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(
    React.createElement(QuotePDF as any, { quote, organization }) as any
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quote_number}.pdf"`,
    },
  })
}
