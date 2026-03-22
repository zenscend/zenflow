import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ProductForm from "@/components/products/ProductForm"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  const product = await prisma.product.findFirst({
    where: { id, organization_id: session!.user.organizationId! },
  })

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground text-sm mt-1">{product.name}</p>
      </div>
      <ProductForm
        productId={id}
        defaultValues={{
          name: product.name,
          description: product.description,
          unit_price: Number(product.unit_price),
          unit_type: product.unit_type,
          is_taxable: product.is_taxable,
          sku: product.sku,
        }}
      />
    </div>
  )
}
