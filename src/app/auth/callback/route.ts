import { NextRequest, NextResponse } from "next/server"
import { supabaseAuthServer } from "@/lib/auth"

// OAuth (Google) lands here with ?code=…; exchanging it sets the session cookies.
// Linking the Supabase user to the existing profile row happens in auth().
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")

  if (code) {
    const supabase = await supabaseAuthServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL("/login?error=oauth", req.nextUrl.origin))
    }
  }

  return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
}
