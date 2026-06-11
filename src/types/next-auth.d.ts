import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      firstName?: string | null
      lastName?: string | null
      email?: string | null
      image?: string | null
      organisationId: string | null
      orgRole: string | null
    }
  }

  interface User {
    organisationId?: string | null
    orgRole?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    organisationId?: string | null
    orgRole?: string | null
  }
}
