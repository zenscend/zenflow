import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect("/login")

  // Users without an org are handled by middleware → /onboarding
  // The onboarding page itself lives in this group, so we must not redirect here
  const orgId = session.user.organizationId
  if (!orgId) {
    // Only allow the onboarding route through without an org
    return <>{children}</>
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  })

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar orgName={org?.name} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
