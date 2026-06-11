import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import QuoteForm from "@/components/quotes/QuoteForm"

export default async function NewQuotePage() {
  const session = await auth()
  const orgId = session!.user.organisationId!

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      where: { organisation_id: orgId, is_active: true },
      orderBy: { display_name: "asc" },
      select: { id: true, display_name: true },
    }),
    prisma.product.findMany({
      where: { organisation_id: orgId, is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit_price: true, unit_type: true, default_tax_id: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Quote</h1>
        <p className="text-muted-foreground text-sm mt-1">Create a quote for a customer</p>
      </div>
      <QuoteForm
        customers={customers}
        products={products.map((p: { id: string; name: string; unit_price: any; unit_type: string; default_tax_id: string | null }) => ({ ...p, unit_price: Number(p.unit_price) }))}
      />
    </div>
  )
}
