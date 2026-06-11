import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const customerSchema = z.object({
  type: z.enum(["BUSINESS", "INDIVIDUAL"]).default("BUSINESS"),
  display_name: z.string().min(1, "Display name is required"),
  company_name: z.string().optional().nullable(),
  trading_name: z.string().optional().nullable(),
  company_reg_no: z.string().optional().nullable(),
  vat_number: z.string().optional().nullable(),
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
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"))
  const skip = (page - 1) * limit

  const where = {
    organisation_id: session.user.organisationId,
    is_active: true,
    ...(search ? {
      OR: [
        { display_name: { contains: search, mode: "insensitive" as const } },
        { company_name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { display_name: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        display_name: true,
        type: true,
        email: true,
        phone: true,
        vat_number: true,
        city: true,
        is_active: true,
        created_at: true,
      },
    }),
    prisma.customer.count({ where }),
  ])

  return NextResponse.json({ data: customers, meta: { page, limit, total } })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organisationId) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })

  const body = await req.json()
  const parsed = customerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: parsed.error } }, { status: 400 })

  const customer = await prisma.customer.create({
    data: { ...parsed.data, organisation_id: session.user.organisationId },
  })

  return NextResponse.json({ data: customer }, { status: 201 })
}
