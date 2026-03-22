import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  unit_price: z.coerce.number().min(0).optional(),
  unit_type: z.string().optional(),
  is_taxable: z.boolean().optional(),
  sku: z.string().optional().nullable(),
})

async function getOwnedProduct(id: string, orgId: string) {
  return prisma.product.findFirst({ where: { id, organization_id: orgId } })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const product = await getOwnedProduct(id, session.user.organizationId)
  if (!product) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  return NextResponse.json({ data: product })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedProduct(id, session.user.organizationId)
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: parsed.error } }, { status: 400 })

  const product = await prisma.product.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ data: product })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { id } = await params
  const existing = await getOwnedProduct(id, session.user.organizationId)
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  await prisma.product.update({ where: { id }, data: { is_active: false } })
  return NextResponse.json({ data: { success: true } })
}
