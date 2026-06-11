import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import QuoteForm from "@/components/quotes/QuoteForm"

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const orgId = session!.user.organisationId!
  const { id } = await params

  const [quote, lineItems, customers, products] = await Promise.all([
    prisma.quote.findFirst({ where: { id, organisation_id: orgId } }),
    prisma.line_item.findMany({ where: { source: "quote", source_id: id }, orderBy: { sort_order: "asc" }, include: { product_line_item: true, custom_line_item: true } }),
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

  if (!quote) notFound()
  if (quote.status !== "DRAFT") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Only DRAFT quotes can be edited</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Quote</h1>
        <p className="text-muted-foreground text-sm mt-1">{quote.quote_number}</p>
      </div>
      <QuoteForm
        quoteId={id}
        customers={customers}
        products={products.map((p: { id: string; name: string; unit_price: any; unit_type: string; default_tax_id: string | null }) => ({ ...p, unit_price: Number(p.unit_price) }))}
        defaultValues={{
          customer_id: quote.customer_id,
          title: quote.title,
          notes: quote.notes,
          internal_notes: quote.internal_notes,
          issue_date: quote.issue_date.toISOString().split("T")[0],
          expiry_date: quote.expiry_date.toISOString().split("T")[0],
          line_items: lineItems.map((li: any) => {
            const sub = li.product_line_item ?? li.custom_line_item
            return {
              product_id: li.product_line_item?.product_id ?? null,
              description: sub?.description ?? "",
              quantity: Number(li.quantity),
              unit_price: Number(sub?.unit_price ?? 0),
              unit_type: sub?.unit_type ?? "item",
              tax_id: li.tax_id,
              discount: Number(li.discount),
            }
          }),
        }}
      />
    </div>
  )
}
