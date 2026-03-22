"use client"

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
  type: z.enum(["BUSINESS", "INDIVIDUAL"]).default("BUSINESS"),
  display_name: z.string().min(1, "Display name is required"),
  company_name: z.string().optional().nullable(),
  trading_name: z.string().optional().nullable(),
  company_reg_no: z.string().optional().nullable(),
  vat_number: z.string().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  id_number: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  alternate_phone: z.string().optional().nullable(),
  address_line_1: z.string().optional().nullable(),
  address_line_2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<FormData>
  customerId?: string
}

export default function CustomerForm({ defaultValues, customerId }: Props) {
  const router = useRouter()
  const isEdit = !!customerId

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues ?? { type: "BUSINESS" },
  })

  const type = watch("type")

  async function onSubmit(data: FormData) {
    const url = isEdit ? `/api/customers/${customerId}` : "/api/customers"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      toast.success(isEdit ? "Customer updated" : "Customer created")
      router.push("/customers")
      router.refresh()
    } else {
      const body = await res.json()
      toast.error(body.error?.message ?? "Something went wrong")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* Type */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setValue("type", v as "BUSINESS" | "INDIVIDUAL")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUSINESS">Business</SelectItem>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>{type === "BUSINESS" ? "Business Details" : "Personal Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display name <span className="text-destructive">*</span></Label>
            <Input {...register("display_name")} placeholder="Used in dropdowns and on documents" />
            {errors.display_name && <p className="text-destructive text-xs">{errors.display_name.message}</p>}
          </div>

          {type === "BUSINESS" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company name</Label>
                  <Input {...register("company_name")} placeholder="Acme (Pty) Ltd" />
                </div>
                <div className="space-y-2">
                  <Label>Trading name</Label>
                  <Input {...register("trading_name")} />
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
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input {...register("first_name")} />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input {...register("last_name")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>SA ID number</Label>
                <Input {...register("id_number")} placeholder="8501015009087" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} placeholder="accounts@client.co.za" />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone")} placeholder="+27 11 123 4567" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Alternate phone</Label>
            <Input {...register("alternate_phone")} />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Address line 1</Label>
            <Input {...register("address_line_1")} />
          </div>
          <div className="space-y-2">
            <Label>Address line 2</Label>
            <Input {...register("address_line_2")} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register("city")} />
            </div>
            <div className="space-y-2">
              <Label>Province</Label>
              <Select
                value={watch("province") ?? ""}
                onValueChange={(v) => setValue("province", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
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
              <Input {...register("postal_code")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea {...register("notes")} rows={3} placeholder="Internal notes about this customer..." />
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/customers")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create customer"}
        </Button>
      </div>
    </form>
  )
}
