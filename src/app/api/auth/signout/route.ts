import { NextResponse } from "next/server"
import { supabaseAuthServer } from "@/lib/auth"

// Sign-out lives in a route handler because that's the only place Next 16
// allows the session cookies to actually be cleared.
export async function POST() {
  const supabase = await supabaseAuthServer()
  await supabase.auth.signOut()
  return NextResponse.json({ data: { ok: true } })
}
