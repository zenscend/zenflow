import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addDays } from "@/lib/utils"
import { Decimal } from "@prisma/client/runtime/client"

const lineItemSchema = z.object({
  product_id: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.001),
  unit_price: z.coerce.number().min(0),
  unit_type: z.string().default("item"),
  tax_id: z.string().nullable().optional(),
  discount: z.coerce.number().min(0).max(100).default(0),
  sort_order: z.number().int().default(0),
})

const quoteSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  title: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, "At least one line item is required"),
})

async function fetchTaxData(orgId: string) {
  const taxes = await prisma.tax.findMany({
    where: { organisation_id: orgId, is_active: true },
    select: { id: true, rate: true },
  })
  const rates = new Map(taxes.map((t) => [t.id, Number(t.rate)]))
  const exemptId = taxes.find((t) => Number(t.rate) === 0)?.id ?? null
  return { rates, exemptId }
}

function calcTotals(items: z.infer<typeof lineItemSchema>[], taxRates: Map<string, number>) {
  let subtotal = 0
  let vatAmount = 0
  const computed = items.map((item, i) => {
    const lineTotal = item.quantity * item.unit_price * (1 - item.discount / 100)
    const taxRate = item.tax_id ? (taxRates.get(item.tax_id) ?? 0) : 0
    const taxAmount = lineTotal * taxRate
    subtotal += lineTotal
    vatAmount += taxAmount
    return { ...item, line_total: lineTotal, tax_amount: taxAmount, sort_order: i }
  })
  return { computed, subtotal, vatAmount, total: subtotal + vatAmount }
}

export function normaliseLineItem(li: any) {
  const sub = li.product_line_item ?? li.custom_line_item
  return {
    ...li,
    description: sub?.description ?? "",
    unit_price: sub?.unit_price ?? 0,
    unit_type: sub?.unit_type ?? "item",
    product_id: li.product_line_item?.product_id ?? null,
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20
  const skip = (page - 1) * limit

  const where = {
    organisation_id: session.user.organisationId,
    ...(status ? { status: status as any } : {}),
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: { customer: { select: { display_name: true } } },
    }),
    prisma.quote.count({ where }),
  ])

  return NextResponse.json({ data: quotes, meta: { page, limit, total } })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const body = await req.json()
  const parsed = quoteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: parsed.error } }, { status: 400 })

  const { customer_id, title, notes, internal_notes, issue_date, expiry_date, line_items } = parsed.data

  const customer = await prisma.customer.findFirst({
    where: { id: customer_id, organisation_id: session.user.organisationId },
  })
  if (!customer) return NextResponse.json({ error: { code: "CUSTOMER_NOT_FOUND" } }, { status: 404 })

  const { rates, exemptId } = await fetchTaxData(session.user.organisationId)
  if (!exemptId) return NextResponse.json({ error: { code: "NO_EXEMPT_TAX", message: "No zero-rate tax found. Please add an Exempt tax in settings." } }, { status: 422 })
  const { computed, subtotal, vatAmount, total } = calcTotals(line_items, rates)

  const quote = await prisma.$transaction(async (tx: any) => {
    const org = await tx.organisation.update({
      where: { id: session.user.organisationId! },
      data: { next_quote_no: { increment: 1 } },
      select: { next_quote_no: true, quote_prefix: true, default_quote_valid_days: true },
    })

    const quoteNumber = `${org.quote_prefix}-${String(org.next_quote_no - 1).padStart(4, "0")}`
    const issueDate = issue_date ? new Date(issue_date) : new Date()
    const expiryDate = expiry_date
      ? new Date(expiry_date)
      : addDays(issueDate, org.default_quote_valid_days)

    const q = await tx.quote.create({
      data: {
        organisation_id: session.user.organisationId!,
        customer_id,
        quote_number: quoteNumber,
        title,
        notes,
        internal_notes,
        issue_date: issueDate,
        expiry_date: expiryDate,
        subtotal: new Decimal(subtotal),
        vat_amount: new Decimal(vatAmount),
        total: new Decimal(total),
      },
      include: { customer: { select: { display_name: true } } },
    })

    for (const item of computed) {
      const li = await tx.line_item.create({
        data: {
          source: "quote",
          source_id: q.id,
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

    const rawLineItems = await tx.line_item.findMany({
      where: { source: "quote", source_id: q.id },
      orderBy: { sort_order: "asc" },
      include: { product_line_item: true, custom_line_item: true, tax: { select: { id: true, name: true, rate: true } } },
    })

    return { ...q, line_items: rawLineItems.map(normaliseLineItem) }
  })

  return NextResponse.json({ data: quote }, { status: 201 })
}
