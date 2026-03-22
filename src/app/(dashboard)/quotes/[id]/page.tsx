"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/lib/button-variants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatZAR, formatDate } from "@/lib/utils"
import { ArrowLeft, Download, Send, CheckCircle, XCircle, RefreshCw, Pencil } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch(`/api/quotes/${id}`)
    const body = await res.json()
    setQuote(body.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function updateStatus(status: string) {
    const res = await fetch(`/api/quotes/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(`Quote marked as ${status.toLowerCase()}`)
      load()
    } else {
      const body = await res.json()
      toast.error(body.error?.message ?? "Failed to update status")
    }
  }

  async function convertToInvoice() {
    const res = await fetch(`/api/quotes/${id}/convert`, { method: "POST" })
    if (res.ok) {
      const body = await res.json()
      toast.success("Invoice created from quote")
      router.push(`/invoices/${body.data.id}`)
    } else {
      const body = await res.json()
      toast.error(body.error?.message ?? "Failed to convert quote")
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
  if (!quote) return <div className="text-center py-12 text-muted-foreground">Quote not found</div>

  const { status } = quote
  const canEdit = status === "DRAFT"
  const canSend = status === "DRAFT"
  const canAccept = status === "SENT"
  const canDecline = status === "SENT"
  const canConvert = ["DRAFT", "SENT", "ACCEPTED"].includes(status) && !quote.converted_to_invoice_id

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/quotes")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{quote.quote_number}</h1>
            <span className={`text-sm px-2 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}>
              {status}
            </span>
          </div>
          {quote.title && <p className="text-muted-foreground mt-1">{quote.title}</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          {canEdit && (
            <Link href={`/quotes/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Pencil className="h-4 w-4 mr-1" /> Edit</Link>
          )}
          {canSend && (
            <Button variant="outline" size="sm" onClick={() => updateStatus("SENT")}>
              <Send className="h-4 w-4 mr-1" /> Mark as Sent
            </Button>
          )}
          {canAccept && (
            <Button variant="outline" size="sm" onClick={() => updateStatus("ACCEPTED")}>
              <CheckCircle className="h-4 w-4 mr-1" /> Mark Accepted
            </Button>
          )}
          {canDecline && (
            <Button variant="outline" size="sm" onClick={() => updateStatus("DECLINED")}>
              <XCircle className="h-4 w-4 mr-1" /> Mark Declined
            </Button>
          )}
          {canConvert && (
            <Button size="sm" onClick={convertToInvoice}>
              <RefreshCw className="h-4 w-4 mr-1" /> Convert to Invoice
            </Button>
          )}
          <a href={`/api/quotes/${id}/pdf`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Download className="h-4 w-4 mr-1" /> Download PDF
          </a>
        </div>
      </div>

      {quote.converted_to_invoice_id && (
        <div className="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
          This quote has been converted to an invoice.{" "}
          <Link href={`/invoices/${quote.converted_to_invoice_id}`} className="underline font-medium">
            View invoice
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{quote.customer.display_name}</p>
            {quote.customer.vat_number && <p className="text-sm text-muted-foreground">VAT: {quote.customer.vat_number}</p>}
            {quote.customer.address_line_1 && <p className="text-sm text-muted-foreground">{quote.customer.address_line_1}</p>}
            {quote.customer.city && <p className="text-sm text-muted-foreground">{quote.customer.city}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Issue date</span>
              <span className="font-medium">{formatDate(quote.issue_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valid until</span>
              <span className="font-medium">{formatDate(quote.expiry_date)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left pb-2">Description</th>
                <th className="text-right pb-2">Qty</th>
                <th className="text-right pb-2">Unit price</th>
                <th className="text-right pb-2">Disc</th>
                <th className="text-right pb-2">Line total</th>
                <th className="text-right pb-2">VAT</th>
              </tr>
            </thead>
            <tbody>
              {quote.line_items.map((item: any) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.description}</td>
                  <td className="text-right py-2">{Number(item.quantity)}</td>
                  <td className="text-right py-2">{formatZAR(item.unit_price)}</td>
                  <td className="text-right py-2">{Number(item.discount) > 0 ? `${Number(item.discount)}%` : "-"}</td>
                  <td className="text-right py-2">{formatZAR(item.line_total)}</td>
                  <td className="text-right py-2">{item.is_taxable ? formatZAR(item.vat_amount) : "Exempt"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal (excl. VAT)</span>
              <span className="font-medium">{formatZAR(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (15%)</span>
              <span className="font-medium">{formatZAR(quote.vat_amount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>Total (incl. VAT)</span>
              <span>{formatZAR(quote.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {quote.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{quote.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
