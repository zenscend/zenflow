import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/client"

const VAT_RATE = 0.15

function calcTotals(items: any[]) {
  let subtotal = 0
  let vatAmount = 0
  const computed = items.map((item, i) => {
    const lineTotal = Number(item.quantity) * Number(item.unit_price) * (1 - Number(item.discount) / 100)
    const vat = item.is_taxable ? lineTotal * VAT_RATE : 0
    subtotal += lineTotal
    vatAmount += vat
    return { ...item, line_total: lineTotal, vat_amount: vat, sort_order: i }
  })
  return { computed, subtotal, vatAmount, total: subtotal + vatAmount }
}

const updateSchema = z.object({
  customer_id: z.string().optional(),
  title: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  line_items: z.array(z.object({
    product_id: z.string().optional().nullable(),
    description: z.string().min(1),
    quantity: z.coerce.number().min(0.001),
    unit_price: z.coerce.number().min(0),
    unit_type: z.string().default("item"),
    is_taxable: z.boolean().default(true),
    discount: z.coerce.number().min(0).max(100).default(0),
  })).optional(),
})

async function getOwnedQuote(id: string, orgId: string) {
  return prisma.quote.findFirst({
    where: { id, organization_id: orgId },
    include: { line_items: { orderBy: { sort_order: "asc" } }, customer: { select: { display_name: true, vat_number: true, address_line_1: true, address_line_2: true, city: true, province: true, postal_code: true } } },
  })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const quote = await getOwnedQuote(id, session.user.organizationId)
  if (!quote) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  return NextResponse.json({ data: quote })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedQuote(id, session.user.organizationId)
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  if (existing.status !== "DRAFT") return NextResponse.json({ error: { code: "NOT_EDITABLE", message: "Only DRAFT quotes can be edited" } }, { status: 409 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: parsed.error } }, { status: 400 })

  const { line_items, issue_date, expiry_date, ...rest } = parsed.data

  const quote = await prisma.$transaction(async (tx: any) => {
    let totals: { subtotal: number; vatAmount: number; total: number } | undefined

    if (line_items) {
      const { computed, subtotal, vatAmount, total } = calcTotals(line_items)
      totals = { subtotal, vatAmount, total }
      await tx.quote_line_item.deleteMany({ where: { quote_id: id } })
      await tx.quote_line_item.createMany({
        data: computed.map((item) => ({
          quote_id: id,
          product_id: item.product_id ?? null,
          description: item.description,
          quantity: new Decimal(item.quantity),
          unit_price: new Decimal(item.unit_price),
          unit_type: item.unit_type,
          is_taxable: item.is_taxable,
          discount: new Decimal(item.discount),
          line_total: new Decimal(item.line_total),
          vat_amount: new Decimal(item.vat_amount),
          sort_order: item.sort_order,
        })),
      })
    }

    return tx.quote.update({
      where: { id },
      data: {
        ...rest,
        ...(issue_date ? { issue_date: new Date(issue_date) } : {}),
        ...(expiry_date ? { expiry_date: new Date(expiry_date) } : {}),
        ...(totals ? {
          subtotal: new Decimal(totals.subtotal),
          vat_amount: new Decimal(totals.vatAmount),
          total: new Decimal(totals.total),
        } : {}),
      },
      include: { line_items: { orderBy: { sort_order: "asc" } }, customer: { select: { display_name: true } } },
    })
  })

  return NextResponse.json({ data: quote })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedQuote(id, session.user.organizationId)
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  if (existing.status !== "DRAFT") return NextResponse.json({ error: { code: "NOT_DELETABLE", message: "Only DRAFT quotes can be deleted" } }, { status: 409 })

  await prisma.quote.delete({ where: { id } })
  return NextResponse.json({ data: { success: true } })
}
