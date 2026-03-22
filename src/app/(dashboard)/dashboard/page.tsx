import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatZAR } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Receipt, AlertCircle, TrendingUp } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  const orgId = session!.user.organizationId!

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    outstandingInvoices,
    overdueInvoices,
    revenueThisMonth,
    revenueLastMonth,
    recentInvoices,
    recentQuotes,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { organization_id: orgId, status: "SENT" },
      _count: true,
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { organization_id: orgId, status: "OVERDUE" },
      _count: true,
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { organization_id: orgId, status: "PAID", paid_at: { gte: startOfMonth } },
      _sum: { paid_amount: true },
    }),
    prisma.invoice.aggregate({
      where: { organization_id: orgId, status: "PAID", paid_at: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { paid_amount: true },
    }),
    prisma.invoice.findMany({
      where: { organization_id: orgId },
      orderBy: { created_at: "desc" },
      take: 5,
      include: { customer: { select: { display_name: true } } },
    }),
    prisma.quote.findMany({
      where: { organization_id: orgId },
      orderBy: { created_at: "desc" },
      take: 5,
      include: { customer: { select: { display_name: true } } },
    }),
  ])

  const metrics = [
    {
      title: "Outstanding Invoices",
      value: formatZAR(outstandingInvoices._sum.total ?? 0),
      sub: `${outstandingInvoices._count} invoice${outstandingInvoices._count !== 1 ? "s" : ""}`,
      icon: Receipt,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Overdue",
      value: formatZAR(overdueInvoices._sum.total ?? 0),
      sub: `${overdueInvoices._count} invoice${overdueInvoices._count !== 1 ? "s" : ""}`,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Revenue This Month",
      value: formatZAR(revenueThisMonth._sum.paid_amount ?? 0),
      sub: "Payments received",
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Revenue Last Month",
      value: formatZAR(revenueLastMonth._sum.paid_amount ?? 0),
      sub: "Payments received",
      icon: TrendingUp,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
  ]

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-500",
    ACCEPTED: "bg-green-100 text-green-700",
    DECLINED: "bg-red-100 text-red-700",
    EXPIRED: "bg-orange-100 text-orange-700",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back. Here&apos;s your business overview.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ title, value, sub, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.customer.display_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatZAR(inv.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] ?? ""}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quotes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Recent Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No quotes yet</p>
            ) : (
              <div className="space-y-3">
                {recentQuotes.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{q.quote_number}</p>
                      <p className="text-xs text-muted-foreground">{q.customer.display_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatZAR(q.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[q.status] ?? ""}`}>
                        {q.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
