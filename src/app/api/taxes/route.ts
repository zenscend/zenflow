import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user.organisationId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }

  const taxes = await prisma.tax.findMany({
    where: { organisation_id: session.user.organisationId, is_active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, rate: true },
  })

  return NextResponse.json({ data: taxes })
}
