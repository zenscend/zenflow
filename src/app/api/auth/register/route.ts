import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error } },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" } },
        { status: 409 }
      )
    }

    const password_hash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password_hash },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
