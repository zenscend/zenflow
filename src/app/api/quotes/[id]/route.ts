import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/client"

async function fetchTaxData(orgId: string) {
  const taxes = await prisma.tax.findMany({
    where: { organisation_id: orgId, is_active: true },
    select: { id: true, rate: true },
  })
  const rates = new Map(taxes.map((t) => [t.id, Number(t.rate)]))
  const exemptId = taxes.find((t) => Number(t.rate) === 0)?.id ?? null
  return { rates, exemptId }
}

function calcTotals(items: any[], rates: Map<string, number>) {
  let subtotal = 0
  let vatAmount = 0
  const computed = items.map((item, i) => {
    const lineTotal = Number(item.quantity) * Number(item.unit_price) * (1 - Number(item.discount) / 100)
    const taxRate = item.tax_id ? (rates.get(item.tax_id) ?? 0) : 0
    const taxAmount = lineTotal * taxRate
    subtotal += lineTotal
    vatAmount += taxAmount
    return { ...item, line_total: lineTotal, tax_amount: taxAmount, sort_order: i }
  })
  return { computed, subtotal, vatAmount, total: subtotal + vatAmount }
}

function normaliseLineItem(li: any) {
  const sub = li.product_line_item ?? li.custom_line_item
  return {
    ...li,
    description: sub?.description ?? "",
    unit_price: sub?.unit_price ?? 0,
    unit_type: sub?.unit_type ?? "item",
    product_id: li.product_line_item?.product_id ?? null,
  }
}

const lineItemIncludes = {
  product_line_item: true,
  custom_line_item: true,
  tax: { select: { id: true, name: true, rate: true } },
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
    tax_id: z.string().nullable().optional(),
    discount: z.coerce.number().min(0).max(100).default(0),
  })).optional(),
})

async function getOwnedQuote(id: string, orgId: string) {
  const quote = await prisma.quote.findFirst({
    where: { id, organisation_id: orgId },
    include: {
      customer: {
        select: {
          display_name: true,
          vat_number: true,
          address_line_1: true,
          address_line_2: true,
          city: true,
          province: true,
          postal_code: true,
        },
      },
    },
  })
  if (!quote) return null
  const rawItems = await prisma.line_item.findMany({
    where: { source: "quote", source_id: id },
    orderBy: { sort_order: "asc" },
    include: lineItemIncludes,
  })
  return { ...quote, line_items: rawItems.map(normaliseLineItem) }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const quote = await getOwnedQuote(id, session.user.organisationId)
  if (!quote) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  return NextResponse.json({ data: quote })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const existing = await prisma.quote.findFirst({ where: { id, organisation_id: session.user.organisationId } })
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  if (existing.status !== "DRAFT") return NextResponse.json({ error: { code: "NOT_EDITABLE", message: "Only DRAFT quotes can be edited" } }, { status: 409 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: parsed.error } }, { status: 400 })

  const { line_items, issue_date, expiry_date, ...rest } = parsed.data

  let exemptId: string | null = null
  let rates = new Map<string, number>()
  if (line_items) {
    const taxData = await fetchTaxData(session.user.organisationId)
    rates = taxData.rates
    exemptId = taxData.exemptId
    if (!exemptId) return NextResponse.json({ error: { code: "NO_EXEMPT_TAX" } }, { status: 422 })
  }

  const quote = await prisma.$transaction(async (tx: any) => {
    let totals: { subtotal: number; vatAmount: number; total: number } | undefined

    if (line_items) {
      const { computed, subtotal, vatAmount, total } = calcTotals(line_items, rates)
      totals = { subtotal, vatAmount, total }
      await tx.line_item.deleteMany({ where: { source: "quote", source_id: id } })

      for (const item of computed) {
        const li = await tx.line_item.create({
          data: {
            source: "quote",
            source_id: id,
            tax_id: item.tax_id || exemptId,
            type: item.product_id ? 1 : 2,
            quantity: new Decimal(item.quantity),
            discount: new Decimal(item.discount),
            line_total: new Decimal(item.line_total),
            tax_amount: new Decimal(item.tax_amount),
            sort_order: item.sort_order,
          },
        })
        if (item.product_id) {
          await tx.product_line_item.create({
            data: {
              line_item_id: li.id,
              product_id: item.product_id,
              description: item.description,
              unit_price: new Decimal(item.unit_price),
              unit_type: item.unit_type,
            },
          })
        } else {
          await tx.custom_line_item.create({
            data: {
              line_item_id: li.id,
              description: item.description,
              unit_price: new Decimal(item.unit_price),
              unit_type: item.unit_type,
            },
          })
        }
      }
    }

    const updated = await tx.quote.update({
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
      include: { customer: { select: { display_name: true } } },
    })

    const rawItems = await tx.line_item.findMany({
      where: { source: "quote", source_id: id },
      orderBy: { sort_order: "asc" },
      include: lineItemIncludes,
    })

    return { ...updated, line_items: rawItems.map(normaliseLineItem) }
  })

  return NextResponse.json({ data: quote })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const existing = await prisma.quote.findFirst({ where: { id, organisation_id: session.user.organisationId } })
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })
  if (existing.status !== "DRAFT") return NextResponse.json({ error: { code: "NOT_DELETABLE", message: "Only DRAFT quotes can be deleted" } }, { status: 409 })

  await prisma.$transaction(async (tx: any) => {
    await tx.line_item.deleteMany({ where: { source: "quote", source_id: id } })
    await tx.quote.delete({ where: { id } })
  })

  return NextResponse.json({ data: { success: true } })
}
