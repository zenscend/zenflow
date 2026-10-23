import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/register", "/auth/callback", "/api/auth"]

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet, headers) => {
          for (const { name, value } of cookiesToSet) req.cookies.set(name, value)
          res = NextResponse.next({ request: req })
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options)
          }
          // Keeps a refreshed session out of CDN caches.
          for (const [key, value] of Object.entries(headers)) res.headers.set(key, value)
        },
      },
    },
  )

  // Verifies the JWT and refreshes it when near expiry, writing the new cookies
  // onto `res` — server components can't do that during render. This is an
  // optimistic check only; every API route and page re-checks via auth().
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)

  const { pathname } = req.nextUrl

  // Carry any refreshed cookies over so a redirect doesn't drop the new session.
  const redirect = (to: string) => {
    const next = NextResponse.redirect(new URL(to, req.nextUrl))
    for (const cookie of res.cookies.getAll()) next.cookies.set(cookie)
    return next
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (signedIn && (pathname === "/login" || pathname === "/register")) {
      return redirect("/dashboard")
    }
    return res
  }

  if (!signedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }
    return redirect("/login")
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
