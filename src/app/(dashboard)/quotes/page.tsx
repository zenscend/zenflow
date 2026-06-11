import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { buttonVariants } from "@/lib/button-variants"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, FileText } from "lucide-react"
import { formatZAR, formatDateShort } from "@/lib/utils"

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
  { value: "EXPIRED", label: "Expired" },
]

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const session = await auth()
  const orgId = session!.user.organisationId!
  const { status = "", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page))
  const limit = 20
  const skip = (pageNum - 1) * limit

  const where = {
    organisation_id: orgId,
    ...(status ? { status: status as any } : {}),
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: { customer: { select: { display_name: true } } },
    }),
    prisma.quote.count({ where }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} quote{total !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/quotes/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" /> New quote
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `/quotes?status=${value}` : "/quotes"}
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
          {quotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No quotes found</p>
              <Link href="/quotes/new" className={buttonVariants({ variant: "outline" }) + " mt-4"}>Create your first quote</Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue date</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q: any) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.quote_number}</TableCell>
                    <TableCell>{q.customer.display_name}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[q.status]}`}>
                        {q.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateShort(q.issue_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateShort(q.expiry_date)}</TableCell>
                    <TableCell className="text-right font-medium">{formatZAR(q.total)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/quotes/${q.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>View</Link>
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
