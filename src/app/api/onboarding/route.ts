import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const onboardingSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  vat_number: z.string().optional(),
  company_reg_no: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
  }

  if (session.user.organizationId) {
    return NextResponse.json({ error: { code: "ALREADY_ONBOARDED", message: "Already part of an organization" } }, { status: 409 })
  }

  const body = await req.json()
  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error } }, { status: 400 })
  }

  const { name, vat_number, company_reg_no, email, phone } = parsed.data

  const org = await prisma.organization.create({
    data: {
      name,
      vat_number: vat_number || null,
      company_reg_no: company_reg_no || null,
      email: email || null,
      phone: phone || null,
      users: {
        create: {
          user_id: session.user.id,
          role: "OWNER",
        },
      },
    },
  })

  return NextResponse.json({ data: { organizationId: org.id } }, { status: 201 })
}
