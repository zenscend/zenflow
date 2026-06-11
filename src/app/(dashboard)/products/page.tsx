import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { buttonVariants } from "@/lib/button-variants"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Package } from "lucide-react"
import { formatZAR } from "@/lib/utils"

export default async function ProductsPage() {
  const session = await auth()
  const orgId = session!.user.organisationId!

  const products = await prisma.product.findMany({
    where: { organisation_id: orgId, is_active: true },
    orderBy: { name: "asc" },
    include: { default_tax: { select: { name: true, rate: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products & Services</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} item{products.length !== 1 ? "s" : ""} in your catalog</p>
        </div>
        <Link href="/products/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" /> Add item
        </Link>
      </div>

      <Card>
        <CardContent className="pt-4">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No products or services yet</p>
              <Link href="/products/new" className={buttonVariants({ variant: "outline" }) + " mt-4"}>Add your first item</Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit type</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.sku ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.unit_type}</TableCell>
                    <TableCell className="font-medium">{formatZAR(p.unit_price)}</TableCell>
                    <TableCell>
                      <Badge variant={p.default_tax ? "default" : "outline"} className="text-xs">
                        {p.default_tax ? p.default_tax.name : "No tax"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/products/${p.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Edit</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
