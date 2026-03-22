import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { addDays } from "@/lib/utils"
import { Decimal } from "@prisma/client/runtime/client"

const lineItemSchema = z.object({
  product_id: z.string().optional().nullable(),
  description: z.string().min(1),
  quantity: z.coerce.number().min(0.001),
  unit_price: z.coerce.number().min(0),
  unit_type: z.string().default("item"),
  is_taxable: z.boolean().default(true),
  discount: z.coerce.number().min(0).max(100).default(0),
  sort_order: z.number().int().default(0),
})

const invoiceSchema = z.object({
  customer_id: z.string().min(1),
  title: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  payment_reference: z.string().optional().nullable(),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1),
})

const VAT_RATE = 0.15

function calcTotals(items: z.infer<typeof lineItemSchema>[]) {
  let subtotal = 0
  let vatAmount = 0
  const computed = items.map((item, i) => {
    const lineTotal = item.quantity * item.unit_price * (1 - item.discount / 100)
    const vat = item.is_taxable ? lineTotal * VAT_RATE : 0
    subtotal += lineTotal
    vatAmount += vat
    return { ...item, line_total: lineTotal, vat_amount: vat, sort_order: i }
  })
  return { computed, subtotal, vatAmount, total: subtotal + vatAmount }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const overdue = searchParams.get("overdue") === "true"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20
  const skip = (page - 1) * limit

  // Mark overdue invoices on each list request
  await prisma.invoice.updateMany({
    where: {
      organization_id: session.user.organizationId,
      status: "SENT",
      due_date: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  })

  const where = {
    organization_id: session.user.organizationId,
    ...(status ? { status: status as any } : {}),
    ...(overdue ? { status: "OVERDUE" as any } : {}),
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: { customer: { select: { display_name: true } } },
    }),
    prisma.invoice.count({ where }),
  ])

  return NextResponse.json({ data: invoices, meta: { page, limit, total } })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const body = await req.json()
  const parsed = invoiceSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: parsed.error } }, { status: 400 })

  const { customer_id, title, notes, internal_notes, payment_reference, issue_date, due_date, line_items } = parsed.data

  const customer = await prisma.customer.findFirst({
    where: { id: customer_id, organization_id: session.user.organizationId },
  })
  if (!customer) return NextResponse.json({ error: { code: "CUSTOMER_NOT_FOUND" } }, { status: 404 })

  const { computed, subtotal, vatAmount, total } = calcTotals(line_items)

  const invoice = await prisma.$transaction(async (tx: any) => {
    const org = await tx.organization.update({
      where: { id: session.user.organizationId! },
      data: { next_invoice_no: { increment: 1 } },
      select: { next_invoice_no: true, invoice_prefix: true, default_payment_terms_days: true },
    })

    const invoiceNumber = `${org.invoice_prefix}-${String(org.next_invoice_no - 1).padStart(4, "0")}`
    const issueDate = issue_date ? new Date(issue_date) : new Date()
    const dueDate = due_date ? new Date(due_date) : addDays(issueDate, org.default_payment_terms_days)

    return tx.invoice.create({
      data: {
        organization_id: session.user.organizationId!,
        customer_id,
        invoice_number: invoiceNumber,
        title,
        notes,
        internal_notes,
        payment_reference,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal: new Decimal(subtotal),
        vat_amount: new Decimal(vatAmount),
        total: new Decimal(total),
        line_items: {
          create: computed.map((item) => ({
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
        },
      },
      include: { line_items: true, customer: { select: { display_name: true } } },
    })
  })

  return NextResponse.json({ data: invoice }, { status: 201 })
}
