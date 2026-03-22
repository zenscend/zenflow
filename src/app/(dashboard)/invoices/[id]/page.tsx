"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/lib/button-variants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatZAR, formatDate } from "@/lib/utils"
import { ArrowLeft, Download, Send, CheckCircle, XCircle, Pencil } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  OVERDUE: "bg-red-100 text-red-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [paidAmount, setPaidAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  async function load() {
    const res = await fetch(`/api/invoices/${id}`)
    const body = await res.json()
    setInvoice(body.data)
    if (body.data) setPaidAmount(String(Number(body.data.total) || 0))
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function updateStatus(status: string, extra?: Record<string, any>) {
    const res = await fetch(`/api/invoices/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    })
    if (res.ok) {
      toast.success(`Invoice marked as ${status.toLowerCase()}`)
      load()
      setMarkPaidOpen(false)
    } else {
      const body = await res.json()
      toast.error(body.error?.message ?? "Failed to update status")
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
  if (!invoice) return <div className="text-center py-12 text-muted-foreground">Invoice not found</div>

  const { status } = invoice
  const canEdit = status === "DRAFT"
  const canSend = status === "DRAFT"
  const canMarkPaid = ["SENT", "OVERDUE"].includes(status)
  const canCancel = ["SENT", "OVERDUE"].includes(status)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
            <span className={`text-sm px-2 py-1 rounded-full font-medium ${STATUS_COLORS[status]}`}>{status}</span>
          </div>
          {invoice.title && <p className="text-muted-foreground mt-1">{invoice.title}</p>}
          {invoice.source_quote_id && (
            <p className="text-sm text-muted-foreground mt-1">
              Created from quote —{" "}
              <Link href={`/quotes/${invoice.source_quote_id}`} className="text-primary underline">
                View quote
              </Link>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {canEdit && (
            <Link href={`/invoices/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Pencil className="h-4 w-4 mr-1" /> Edit</Link>
          )}
          {canSend && (
            <Button variant="outline" size="sm" onClick={() => updateStatus("SENT")}>
              <Send className="h-4 w-4 mr-1" /> Mark as Sent
            </Button>
          )}
          {canMarkPaid && (
            <>
              <Button size="sm" onClick={() => setMarkPaidOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Mark as Paid
              </Button>
              <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark Invoice as Paid</DialogTitle>
                  <DialogDescription>Record the payment details for this invoice.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Amount received</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R</span>
                      <Input type="number" step="0.01" className="pl-7" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment method</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? "EFT")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EFT">EFT</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>Cancel</Button>
                  <Button onClick={() => updateStatus("PAID", { paid_amount: Number(paidAmount), payment_method: paymentMethod })}>
                    Confirm Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" onClick={() => updateStatus("CANCELLED")}>
              <XCircle className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}
          <a href={`/api/invoices/${id}/pdf`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Download className="h-4 w-4 mr-1" /> Download PDF
          </a>
        </div>
      </div>

      {status === "PAID" && invoice.paid_at && (
        <div className="rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
          Paid {formatDate(invoice.paid_at)} — {formatZAR(invoice.paid_amount ?? invoice.total)}
          {invoice.payment_method ? ` via ${invoice.payment_method}` : ""}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Billed To</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{invoice.customer.display_name}</p>
            {invoice.customer.vat_number && <p className="text-sm text-muted-foreground">VAT: {invoice.customer.vat_number}</p>}
            {invoice.customer.address_line_1 && <p className="text-sm text-muted-foreground">{invoice.customer.address_line_1}</p>}
            {invoice.customer.city && <p className="text-sm text-muted-foreground">{invoice.customer.city}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Issue date</span>
              <span className="font-medium">{formatDate(invoice.issue_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Due date</span>
              <span className="font-medium">{formatDate(invoice.due_date)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
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
              {invoice.line_items.map((item: any) => (
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
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (excl. VAT)</span><span className="font-medium">{formatZAR(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">VAT (15%)</span><span className="font-medium">{formatZAR(invoice.vat_amount)}</span></div>
            <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total (incl. VAT)</span><span>{formatZAR(invoice.total)}</span></div>
          </div>
        </CardContent>
      </Card>

      {invoice.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{invoice.notes}</p></CardContent>
        </Card>
      )}
    </div>
  )
}
