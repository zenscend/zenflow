import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAuthServer } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
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

    const { first_name, last_name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" } },
        { status: 409 }
      )
    }

    const supabase = await supabaseAuthServer()
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error || !data.user) {
      return NextResponse.json(
        { error: { code: "SIGNUP_FAILED", message: error?.message ?? "Could not create account" } },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: { first_name, last_name, email, auth_user_id: data.user.id },
      select: { id: true, first_name: true, last_name: true, email: true },
    })

    // No session when email confirmation is enabled on the Supabase project —
    // the client then sends the user to /login instead of /onboarding.
    return NextResponse.json({ data: { ...user, signedIn: Boolean(data.session) } }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
      { status: 500 }
    )
  }
}
