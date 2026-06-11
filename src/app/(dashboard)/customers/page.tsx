import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/lib/button-variants"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users } from "lucide-react"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const session = await auth()
  const orgId = session!.user.organisationId!
  const { search = "", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 20
  const skip = (pageNum - 1) * limit

  const where = {
    organisation_id: orgId,
    is_active: true,
    ...(search ? {
      OR: [
        { display_name: { contains: search, mode: "insensitive" as const } },
        { company_name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { display_name: "asc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} customer{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/customers/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" /> Add customer
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <form className="flex gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="flex h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button type="submit" variant="outline" size="sm">Search</Button>
          </form>
        </CardHeader>
        <CardContent className="pt-4">
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search ? "No customers found matching your search" : "No customers yet"}
              </p>
              {!search && (
                <Link href="/customers/new" className={buttonVariants({ variant: "outline" }) + " mt-4"}>Add your first customer</Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>VAT No.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {c.type === "BUSINESS" ? "Business" : "Individual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.vat_number ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/customers/${c.id}/edit`} className={buttonVariants({ variant: "ghost", size: "sm" })}>Edit</Link>
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
