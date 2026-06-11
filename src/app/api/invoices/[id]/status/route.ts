import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT"],
  SENT: ["PAID", "CANCELLED", "OVERDUE"],
  OVERDUE: ["PAID", "CANCELLED"],
  PAID: [],
  CANCELLED: [],
}

const statusSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]),
  paid_at: z.string().optional(),
  paid_amount: z.coerce.number().optional(),
  payment_method: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const invoice = await prisma.invoice.findFirst({
    where: { id, organisation_id: session.user.organisationId },
  })
  if (!invoice) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  const body = await req.json()
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 })

  const { status, paid_at, paid_amount, payment_method } = parsed.data
  const allowed = VALID_TRANSITIONS[invoice.status] ?? []

  if (!allowed.includes(status)) {
    return NextResponse.json({
      error: { code: "INVALID_TRANSITION", message: `Cannot transition from ${invoice.status} to ${status}` }
    }, { status: 409 })
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status,
      ...(status === "PAID" ? {
        paid_at: paid_at ? new Date(paid_at) : new Date(),
        paid_amount: paid_amount ?? invoice.total,
        payment_method: payment_method ?? null,
      } : {}),
    },
  })

  return NextResponse.json({ data: updated })
}
