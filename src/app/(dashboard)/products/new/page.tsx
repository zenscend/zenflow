import ProductForm from "@/components/products/ProductForm"

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Product / Service</h1>
        <p className="text-muted-foreground text-sm mt-1">Add an item to your catalog</p>
      </div>
      <ProductForm />
    </div>
  )
}
