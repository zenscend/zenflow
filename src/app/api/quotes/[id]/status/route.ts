import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "DECLINED"],
  ACCEPTED: [],
  DECLINED: [],
  EXPIRED: [],
}

const statusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"]),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const quote = await prisma.quote.findFirst({
    where: { id, organisation_id: session.user.organisationId },
  })

  if (!quote) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  const body = await req.json()
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 })

  const { status } = parsed.data
  const allowed = VALID_TRANSITIONS[quote.status] ?? []

  if (!allowed.includes(status)) {
    return NextResponse.json({
      error: { code: "INVALID_TRANSITION", message: `Cannot transition from ${quote.status} to ${status}` }
    }, { status: 409 })
  }

  const updated = await prisma.quote.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ data: updated })
}
