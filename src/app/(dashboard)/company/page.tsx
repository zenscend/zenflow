"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const SA_PROVINCES = [
  { value: "EASTERN_CAPE", label: "Eastern Cape" },
  { value: "FREE_STATE", label: "Free State" },
  { value: "GAUTENG", label: "Gauteng" },
  { value: "KWAZULU_NATAL", label: "KwaZulu-Natal" },
  { value: "LIMPOPO", label: "Limpopo" },
  { value: "MPUMALANGA", label: "Mpumalanga" },
  { value: "NORTH_WEST", label: "North West" },
  { value: "NORTHERN_CAPE", label: "Northern Cape" },
  { value: "WESTERN_CAPE", label: "Western Cape" },
]

const schema = z.object({
  name: z.string().min(2, "Company name is required"),
  trading_name: z.string().optional().nullable(),
  company_reg_no: z.string().optional().nullable(),
  vat_number: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address_line_1: z.string().optional().nullable(),
  address_line_2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account_name: z.string().optional().nullable(),
  bank_account_no: z.string().optional().nullable(),
  bank_branch_code: z.string().optional().nullable(),
  bank_account_type: z.enum(["CHEQUE", "SAVINGS", "TRANSMISSION"]).optional().nullable(),
  default_payment_terms_days: z.coerce.number().int().min(1).default(30),
  default_quote_valid_days: z.coerce.number().int().min(1).default(30),
  default_notes: z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

export default function CompanyPage() {
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          reset({
            ...data,
            default_payment_terms_days: data.default_payment_terms_days ?? 30,
            default_quote_valid_days: data.default_quote_valid_days ?? 30,
          })
        }
        setLoading(false)
      })
  }, [reset])

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success("Company settings saved")
    } else {
      toast.error("Failed to save settings")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your organisation profile and defaults</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Company Identity</CardTitle>
            <CardDescription>This information appears on your quotes and invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registered company name <span className="text-destructive">*</span></Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Trading name</Label>
                <Input {...register("trading_name")} placeholder="If different from registered name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company registration no.</Label>
                <Input {...register("company_reg_no")} placeholder="2023/123456/07" />
              </div>
              <div className="space-y-2">
                <Label>VAT number</Label>
                <Input {...register("vat_number")} placeholder="4123456789" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business email</Label>
                <Input type="email" {...register("email")} placeholder="info@company.co.za" />
              </div>
              <div className="space-y-2">
                <Label>Phone number</Label>
                <Input {...register("phone")} placeholder="+27 11 123 4567" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input {...register("website")} placeholder="https://www.company.co.za" />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Business Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Address line 1</Label>
              <Input {...register("address_line_1")} placeholder="123 Main Street" />
            </div>
            <div className="space-y-2">
              <Label>Address line 2</Label>
              <Input {...register("address_line_2")} placeholder="Sandton City" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...register("city")} placeholder="Johannesburg" />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Select
                  value={watch("province") ?? ""}
                  onValueChange={(v) => setValue("province", v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {SA_PROVINCES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Postal code</Label>
                <Input {...register("postal_code")} placeholder="2196" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banking Details */}
        <Card>
          <CardHeader>
            <CardTitle>Banking Details</CardTitle>
            <CardDescription>Shown on invoices so clients can make EFT payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bank name</Label>
                <Input {...register("bank_name")} placeholder="FNB" />
              </div>
              <div className="space-y-2">
                <Label>Account holder name</Label>
                <Input {...register("bank_account_name")} placeholder="Acme (Pty) Ltd" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Account number</Label>
                <Input {...register("bank_account_no")} placeholder="62123456789" />
              </div>
              <div className="space-y-2">
                <Label>Branch code</Label>
                <Input {...register("bank_branch_code")} placeholder="250655" />
              </div>
              <div className="space-y-2">
                <Label>Account type</Label>
                <Select
                  value={watch("bank_account_type") ?? ""}
                  onValueChange={(v) => setValue("bank_account_type", (v as any) || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="TRANSMISSION">Transmission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>Document Defaults</CardTitle>
            <CardDescription>Default settings applied to new quotes and invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment terms (days)</Label>
                <Input type="number" {...register("default_payment_terms_days")} min={1} />
              </div>
              <div className="space-y-2">
                <Label>Quote validity (days)</Label>
                <Input type="number" {...register("default_quote_valid_days")} min={1} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default notes / terms</Label>
              <Textarea
                {...register("default_notes")}
                rows={3}
                placeholder="e.g. Payment is due within 30 days of invoice date. Please use the invoice number as reference."
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
