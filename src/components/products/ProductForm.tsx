"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
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

const UNIT_TYPES = ["item", "hour", "day", "week", "month", "kg", "litre", "m²", "m³", "km"]

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  unit_price: z.coerce.number().min(0, "Price must be 0 or more"),
  unit_type: z.string().default("item"),
  default_tax_id: z.string().nullable().optional(),
  sku: z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

interface Tax { id: string; name: string; rate: string }

interface Props {
  defaultValues?: Partial<FormData>
  productId?: string
}

export default function ProductForm({ defaultValues, productId }: Props) {
  const router = useRouter()
  const isEdit = !!productId
  const [taxes, setTaxes] = useState<Tax[]>([])

  useEffect(() => {
    fetch("/api/taxes")
      .then((r) => r.json())
      .then((body) => setTaxes(body.data ?? []))
      .catch(() => {})
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues ?? { unit_type: "item", default_tax_id: null },
  })

  async function onSubmit(data: FormData) {
    const url = isEdit ? `/api/products/${productId}` : "/api/products"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success(isEdit ? "Product updated" : "Product created")
      router.push("/products")
      router.refresh()
    } else {
      const body = await res.json()
      toast.error(body.error?.message ?? "Something went wrong")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Product / Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input {...register("name")} placeholder="e.g. Web Design, Consulting, Delivery" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={2} placeholder="Optional description shown on quotes and invoices" />
          </div>

          <div className="space-y-2">
            <Label>SKU / Code</Label>
            <Input {...register("sku")} placeholder="e.g. WD-001" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit price (excl. tax) <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R</span>
                <Input type="number" step="0.01" min="0" className="pl-7" {...register("unit_price")} />
              </div>
              {errors.unit_price && <p className="text-destructive text-xs">{errors.unit_price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Unit type</Label>
              <Select value={watch("unit_type")} onValueChange={(v) => setValue("unit_type", v ?? "item")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default tax</Label>
            <Select
              value={(watch("default_tax_id") ?? "") as string}
              onValueChange={(v) => setValue("default_tax_id", v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No tax" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No tax</SelectItem>
                {taxes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} ({(Number(t.rate) * 100).toFixed(0)}%)</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Applied by default when this item is added to a quote or invoice</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/products")}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create item"}
        </Button>
      </div>
    </form>
  )
}
