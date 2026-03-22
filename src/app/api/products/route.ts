import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  unit_price: z.coerce.number().min(0, "Price must be 0 or more"),
  unit_type: z.string().default("item"),
  is_taxable: z.boolean().default(true),
  sku: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""

  const products = await prisma.product.findMany({
    where: {
      organization_id: session.user.organizationId,
      is_active: true,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ data: products })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organizationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const body = await req.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: parsed.error } }, { status: 400 })

  const product = await prisma.product.create({
    data: { ...parsed.data, organization_id: session.user.organizationId },
  })

  return NextResponse.json({ data: product }, { status: 201 })
}
