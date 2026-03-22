import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            organizations: {
              include: { organization: true },
              take: 1,
              orderBy: { joined_at: "asc" },
            },
          },
        })

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        )
        if (!valid) return null

        const membership = user.organizations[0]

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          organizationId: membership?.organization_id ?? null,
          orgRole: membership?.role ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.userId = user.id
        token.organizationId = (user as any).organizationId
        token.orgRole = (user as any).orgRole
      }
      // Patch token when session.update() is called from the client (e.g. after onboarding)
      if (trigger === "update" && session?.organizationId) {
        token.organizationId = session.organizationId
        token.orgRole = session.orgRole ?? token.orgRole
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.organizationId = token.organizationId as string | null
      session.user.orgRole = token.orgRole as string | null
      return session
    },
  },
})
