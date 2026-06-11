"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus } from "lucide-react"
import { formatZAR } from "@/lib/utils"

const lineItemSchema = z.object({
  product_id: z.string().optional().nullable(),
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().min(0.001),
  unit_price: z.coerce.number().min(0),
  unit_type: z.string().default("item"),
  tax_id: z.string().nullable().optional(),
  discount: z.coerce.number().min(0).max(100).default(0),
})

const schema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  title: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  payment_reference: z.string().optional().nullable(),
  issue_date: z.string(),
  due_date: z.string(),
  line_items: z.array(lineItemSchema).min(1),
})
type FormData = z.infer<typeof schema>

interface Customer { id: string; display_name: string }
interface Product { id: string; name: string; unit_price: number; unit_type: string; default_tax_id?: string | null }
interface Tax { id: string; name: string; rate: string }

interface Props {
  customers: Customer[]
  products: Product[]
  defaultValues?: Partial<FormData>
  invoiceId?: string
}

function todayStr() { return new Date().toISOString().split("T")[0] }
function addDaysStr(days: number) {
  const d = new Date(); d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

export default function InvoiceForm({ customers, products, defaultValues, invoiceId }: Props) {
  const router = useRouter()
  const isEdit = !!invoiceId
  const [taxes, setTaxes] = useState<Tax[]>([])

  useEffect(() => {
    fetch("/api/taxes")
      .then((r) => r.json())
      .then((body) => setTaxes(body.data ?? []))
      .catch(() => {})
  }, [])

  const { register, handleSubmit, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues ?? {
      issue_date: todayStr(),
      due_date: addDaysStr(30),
      line_items: [{ description: "", quantity: 1, unit_price: 0, unit_type: "item", tax_id: null, discount: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "line_items" })
  const lineItems = useWatch({ control, name: "line_items" }) ?? []

  const taxRateMap = new Map(taxes.map((t) => [t.id, Number(t.rate)]))
  const { subtotal, vatAmount, total } = lineItems.reduce(
    (acc, item) => {
      const qty = Number(item?.quantity) || 0
      const price = Number(item?.unit_price) || 0
      const disc = Number(item?.discount) || 0
      const lineTotal = qty * price * (1 - disc / 100)
      const taxRate = item?.tax_id ? (taxRateMap.get(item.tax_id) ?? 0) : 0
      const tax = lineTotal * taxRate
      return { subtotal: acc.subtotal + lineTotal, vatAmount: acc.vatAmount + tax, total: acc.total + lineTotal + tax }
    },
    { subtotal: 0, vatAmount: 0, total: 0 }
  )

  function fillFromProduct(index: number, productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    setValue(`line_items.${index}.description`, p.name)
    setValue(`line_items.${index}.unit_price`, p.unit_price)
    setValue(`line_items.${index}.unit_type`, p.unit_type)
    setValue(`line_items.${index}.tax_id`, p.default_tax_id ?? null)
    setValue(`line_items.${index}.product_id`, p.id)
  }

  async function onSubmit(data: FormData) {
    const url = isEdit ? `/api/invoices/${invoiceId}` : "/api/invoices"
    const method = isEdit ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const body = await res.json()
      toast.success(isEdit ? "Invoice updated" : "Invoice created")
      router.push(`/invoices/${body.data.id}`)
      router.refresh()
    } else {
      const body = await res.json()
      toast.error(body.error?.message ?? "Something went wrong")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Customer <span className="text-destructive">*</span></Label>
            <Select value={(watch("customer_id") ?? "") as string} onValueChange={(v) => setValue("customer_id", v ?? "")}>
              <SelectTrigger>
                {watch("customer_id")
                  ? <span>{customers.find(c => c.id === watch("customer_id"))?.display_name}</span>
                  : <span className="text-muted-foreground">Select customer...</span>}
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.customer_id && <p className="text-destructive text-xs">{errors.customer_id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Invoice title / subject</Label>
            <Input {...register("title")} placeholder="e.g. Professional services for March 2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue date</Label>
              <Input type="date" {...register("issue_date")} />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" {...register("due_date")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment reference</Label>
            <Input {...register("payment_reference")} placeholder="e.g. Please use invoice number as reference" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_100px_40px] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>Description</span><span>Qty</span><span>Unit price (excl.)</span><span>Disc %</span><span>Tax</span><span></span>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2 border rounded-lg p-3 md:border-0 md:p-0">
              {products.length > 0 && (
                <div className="md:hidden">
                  <Select onValueChange={(v: string | null) => v && fillFromProduct(index, v)}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Fill from catalog..." /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="md:grid md:grid-cols-[2fr_1fr_1fr_1fr_100px_40px] gap-2">
                <div className="space-y-1">
                  <Input placeholder="Description" {...register(`line_items.${index}.description`)} />
                  {products.length > 0 && (
                    <div className="hidden md:block">
                      <Select onValueChange={(v: string | null) => v && fillFromProduct(index, v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Fill from catalog" /></SelectTrigger>
                        <SelectContent>
                          {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Input type="number" step="0.001" min="0" placeholder="Qty" {...register(`line_items.${index}.quantity`)} />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R</span>
                  <Input type="number" step="0.01" min="0" className="pl-7" placeholder="0.00" {...register(`line_items.${index}.unit_price`)} />
                </div>
                <Input type="number" step="0.01" min="0" max="100" placeholder="0" {...register(`line_items.${index}.discount`)} />
                <Select
                  value={(watch(`line_items.${index}.tax_id`) ?? "") as string}
                  onValueChange={(v: string | null) => setValue(`line_items.${index}.tax_id`, v || null)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="No tax" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No tax</SelectItem>
                    {taxes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="sm" onClick={() => fields.length > 1 && remove(index)} disabled={fields.length === 1} className="h-9 w-9 p-0">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm"
            onClick={() => append({ description: "", quantity: 1, unit_price: 0, unit_type: "item", tax_id: null, discount: 0 })}>
            <Plus className="h-4 w-4 mr-1" /> Add line item
          </Button>
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (excl. tax)</span><span className="font-medium">{formatZAR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-medium">{formatZAR(vatAmount)}</span></div>
            <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total (incl. tax)</span><span>{formatZAR(total)}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes & Terms</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Notes (shown on invoice)</Label>
            <Textarea {...register("notes")} rows={3} placeholder="Additional notes shown on the invoice..." />
            <p className="text-xs text-muted-foreground">Banking details are pulled automatically from <a href="/company" className="underline">Company Settings</a> and printed on the PDF.</p>
          </div>
          <div className="space-y-2">
            <Label>Internal notes</Label>
            <Textarea {...register("internal_notes")} rows={2} placeholder="Internal reference notes..." />
          </div>
        </CardContent>
      </Card>

      <Separator />
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create invoice"}</Button>
      </div>
    </form>
  )
}
