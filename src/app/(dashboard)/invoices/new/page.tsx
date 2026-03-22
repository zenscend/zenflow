import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import InvoiceForm from "@/components/invoices/InvoiceForm"

export default async function NewInvoicePage() {
  const session = await auth()
  const orgId = session!.user.organizationId!

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      where: { organization_id: orgId, is_active: true },
      orderBy: { display_name: "asc" },
      select: { id: true, display_name: true },
    }),
    prisma.product.findMany({
      where: { organization_id: orgId, is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit_price: true, unit_type: true, is_taxable: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Invoice</h1>
        <p className="text-muted-foreground text-sm mt-1">Create an invoice for a customer</p>
      </div>
      <InvoiceForm
        customers={customers}
        products={products.map((p: { id: string; name: string; unit_price: any; unit_type: string; is_taxable: boolean }) => ({ ...p, unit_price: Number(p.unit_price) }))}
      />
    </div>
  )
}
