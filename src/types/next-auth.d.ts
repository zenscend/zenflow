import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      organizationId: string | null
      orgRole: string | null
    }
  }

  interface User {
    organizationId?: string | null
    orgRole?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    organizationId?: string | null
    orgRole?: string | null
  }
}
