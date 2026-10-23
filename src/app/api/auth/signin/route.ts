import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { supabaseAuthServer } from "@/lib/auth"
import { supabaseServer } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const UNAUTHORIZED = NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
  { status: 401 },
)

/**
 * Moves a pre-Supabase account across on the first correct password entry:
 * verify our own bcrypt hash, create the Supabase user with that password,
 * then drop the hash. Returns true if the account is now in Supabase.
 *
 * ponytail: one-shot migration shim so live users never get a forced password
 * reset. Delete it once `select count(*) from "user" where password_hash is not null`
 * is 0.
 */
async function migrateLegacyPassword(email: string, password: string) {
  const legacy = await prisma.user.findUnique({ where: { email } })
  if (!legacy?.password_hash) return false
  if (!(await bcrypt.compare(password, legacy.password_hash))) return false

  const { error } = await supabaseServer().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) return false

  await prisma.user.update({ where: { email }, data: { password_hash: null } })
  return true
}

export async function POST(req: NextRequest) {
  const parsed = signinSchema.safeParse(await req.json())
  if (!parsed.success) return UNAUTHORIZED

  const { email, password } = parsed.data
  const supabase = await supabaseAuthServer()

  let { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error && (await migrateLegacyPassword(email, password))) {
    ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
  }

  if (error) return UNAUTHORIZED

  return NextResponse.json({ data: { ok: true } })
}
