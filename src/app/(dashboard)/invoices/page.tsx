import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { buttonVariants } from "@/lib/button-variants"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Receipt } from "lucide-react"
import { formatZAR, formatDateShort } from "@/lib/utils"

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
]

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  OVERDUE: "bg-red-100 text-red-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  const orgId = session!.user.organizationId!
  const { status = "", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 20
  const skip = (pageNum - 1) * limit

  // Mark overdue
  await prisma.invoice.updateMany({
    where: { organization_id: orgId, status: "SENT", due_date: { lt: new Date() } },
    data: { status: "OVERDUE" },
  })

  const where = {
    organization_id: orgId,
    ...(status ? { status: status as any } : {}),
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: { customer: { select: { display_name: true } } },
    }),
    prisma.invoice.count({ where }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} invoice{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/invoices/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" /> New invoice
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `/invoices?status=${value}` : "/invoices"}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              status === value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No invoices found</p>
              <Link href="/invoices/new" className={buttonVariants({ variant: "outline" }) + " mt-4"}>Create your first invoice</Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue date</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.customer.display_name}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[inv.status]}`}>
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateShort(inv.issue_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateShort(inv.due_date)}</TableCell>
                    <TableCell className="text-right font-medium">{formatZAR(inv.total)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/invoices/${inv.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>View</Link>
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
