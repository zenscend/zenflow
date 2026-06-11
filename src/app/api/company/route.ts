import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  trading_name: z.string().optional().nullable(),
  company_reg_no: z.string().optional().nullable(),
  vat_number: z.string().optional().nullable(),
  address_line_1: z.string().optional().nullable(),
  address_line_2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.enum(["EASTERN_CAPE","FREE_STATE","GAUTENG","KWAZULU_NATAL","LIMPOPO","MPUMALANGA","NORTH_WEST","NORTHERN_CAPE","WESTERN_CAPE"]).optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account_name: z.string().optional().nullable(),
  bank_account_no: z.string().optional().nullable(),
  bank_branch_code: z.string().optional().nullable(),
  bank_account_type: z.enum(["CHEQUE","SAVINGS","TRANSMISSION"]).optional().nullable(),
  default_payment_terms_days: z.number().int().min(1).optional(),
  default_quote_valid_days: z.number().int().min(1).optional(),
  default_notes: z.string().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user.organisationId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }

  const org = await prisma.organisation.findUnique({
    where: { id: session.user.organisationId },
  })

  if (!org) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 })

  return NextResponse.json({ data: org })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organisationId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: parsed.error } }, { status: 400 })
  }

  const org = await prisma.organisation.update({
    where: { id: session.user.organisationId },
    data: parsed.data,
  })

  return NextResponse.json({ data: org })
}
