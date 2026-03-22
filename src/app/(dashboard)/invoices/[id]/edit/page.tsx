import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import InvoiceForm from "@/components/invoices/InvoiceForm"

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const orgId = session!.user.organizationId!
  const { id } = await params

  const [invoice, customers, products] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, organization_id: orgId },
      include: { line_items: { orderBy: { sort_order: "asc" } } },
    }),
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

  if (!invoice) notFound()
  if (invoice.status !== "DRAFT") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Only DRAFT invoices can be edited</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Invoice</h1>
        <p className="text-muted-foreground text-sm mt-1">{invoice.invoice_number}</p>
      </div>
      <InvoiceForm
        invoiceId={id}
        customers={customers}
        products={products.map((p: { id: string; name: string; unit_price: any; unit_type: string; is_taxable: boolean }) => ({ ...p, unit_price: Number(p.unit_price) }))}
        defaultValues={{
          customer_id: invoice.customer_id,
          title: invoice.title,
          notes: invoice.notes,
          internal_notes: invoice.internal_notes,
          payment_reference: invoice.payment_reference,
          issue_date: invoice.issue_date.toISOString().split("T")[0],
          due_date: invoice.due_date.toISOString().split("T")[0],
          line_items: invoice.line_items.map((li: any) => ({
            product_id: li.product_id,
            description: li.description,
            quantity: Number(li.quantity),
            unit_price: Number(li.unit_price),
            unit_type: li.unit_type,
            is_taxable: li.is_taxable,
            discount: Number(li.discount),
          })),
        }}
      />
    </div>
  )
}
