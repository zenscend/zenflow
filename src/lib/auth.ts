import { cache } from "react"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { UserMetadata } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"
import { splitFullName } from "@/lib/utils"

export interface Session {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    image: string | null
    organisationId: string | null
    orgRole: string | null
  }
}

/**
 * Supabase client bound to the request cookies. Uses the *publishable* key —
 * never the service-role client in `@/utils/supabase/server`, which bypasses RLS.
 */
export async function supabaseAuthServer() {
  const store = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              store.set(name, value, options)
            }
          } catch {
            // Next 16 forbids cookie writes during render. Harmless here:
            // proxy.ts refreshes the session and writes the cookies instead.
          }
        },
      },
    },
  )
}

const WITH_FIRST_MEMBERSHIP = {
  organisations: {
    take: 1,
    orderBy: { joined_at: "asc" as const },
    select: { organisation_id: true, role: true },
  },
}

/**
 * Finds the profile row for a Supabase auth user, linking it on first sign-in.
 *
 * Existing (pre-Supabase) accounts are matched by email and stamped with
 * `auth_user_id`, which keeps their id — and therefore every organisation,
 * quote and invoice attached to it — exactly as it was.
 */
async function loadProfile(authUserId: string, email: string, meta: UserMetadata) {
  const existing = await prisma.user.findFirst({
    where: { auth_user_id: authUserId },
    include: WITH_FIRST_MEMBERSHIP,
  })
  if (existing) return existing

  return prisma.user.upsert({
    where: { email },
    update: {
      auth_user_id: authUserId,
      // Don't clobber a name/avatar the user already has on file.
      image: (meta.avatar_url as string | undefined) ?? undefined,
    },
    create: {
      email,
      auth_user_id: authUserId,
      ...splitFullName(meta.full_name ?? meta.name),
      image: (meta.avatar_url as string | undefined) ?? null,
    },
    include: WITH_FIRST_MEMBERSHIP,
  })
}

/**
 * The current session, or null. Shape is deliberately unchanged from the
 * NextAuth version this replaced so every existing call site still works.
 *
 * `cache()` memoises it for the duration of one render/request, so a page that
 * calls `auth()` several times still does one JWT verification and one query.
 */
export const auth = cache(async (): Promise<Session | null> => {
  const supabase = await supabaseAuthServer()

  // getClaims() verifies the JWT locally against the project's public signing
  // key (and refreshes it when near expiry), so this is not a round-trip to
  // the auth server the way getUser() would be.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub || !claims.email) return null

  const profile = await loadProfile(claims.sub, claims.email, claims.user_metadata ?? {})
  const membership = profile.organisations[0]

  return {
    user: {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      image: profile.image,
      organisationId: membership?.organisation_id ?? null,
      orgRole: membership?.role ?? null,
    },
  }
})
