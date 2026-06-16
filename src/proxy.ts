import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = ["/login", "/register", "/api/auth"]

export async function proxy(req: NextRequest) {
  const { nextUrl } = req
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p))

  const token = await getToken({ req, secret: process.env.AUTH_SECRET })

  // Allow public paths and static assets
  if (isPublic) {
    // Redirect already-authenticated users away from login/register
    if (token && !nextUrl.pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  // No session → login
  if (!token) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  const isApi = nextUrl.pathname.startsWith("/api/")

  // Authenticated but no org → onboarding (skip for API routes — they handle auth themselves)
  if (!token.organisationId && nextUrl.pathname !== "/onboarding" && !isApi) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl))
  }

  // Has org but trying to access onboarding → dashboard
  if (token.organisationId && nextUrl.pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
