import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  type: z.enum(["BUSINESS", "INDIVIDUAL"]).optional(),
  display_name: z.string().min(1).optional(),
  company_name: z.string().optional().nullable(),
  trading_name: z.string().optional().nullable(),
  company_reg_no: z.string().optional().nullable(),
  vat_number: z.string().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  id_number: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  alternate_phone: z.string().optional().nullable(),
  address_line_1: z.string().optional().nullable(),
  address_line_2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.enum(["EASTERN_CAPE","FREE_STATE","GAUTENG","KWAZULU_NATAL","LIMPOPO","MPUMALANGA","NORTH_WEST","NORTHERN_CAPE","WESTERN_CAPE"]).optional().nullable(),
  postal_code: z.string().optional().nullable(),
  billing_address_line_1: z.string().optional().nullable(),
  billing_address_line_2: z.string().optional().nullable(),
  billing_city: z.string().optional().nullable(),
  billing_province: z.enum(["EASTERN_CAPE","FREE_STATE","GAUTENG","KWAZULU_NATAL","LIMPOPO","MPUMALANGA","NORTH_WEST","NORTHERN_CAPE","WESTERN_CAPE"]).optional().nullable(),
  billing_postal_code: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).partial()

async function getOwnedCustomer(id: string, orgId: string) {
  return prisma.customer.findFirst({ where: { id, organization_id: orgId } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const customer = await getOwnedCustomer(id, session.user.organizationId)
  if (!customer) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  return NextResponse.json({ data: customer })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedCustomer(id, session.user.organizationId)
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: parsed.error } }, { status: 400 })

  const customer = await prisma.customer.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ data: customer })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedCustomer(id, session.user.organizationId)
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  // Soft delete
  await prisma.customer.update({ where: { id }, data: { is_active: false } })
  return NextResponse.json({ data: { success: true } })
}
