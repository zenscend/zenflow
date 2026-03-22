"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const schema = z.object({
  name: z.string().min(2, "Company name is required"),
  vat_number: z.string().optional(),
  company_reg_no: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function OnboardingPage() {
  const { update } = useSession()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    const body = await res.json()

    if (!res.ok) {
      setError(body.error?.message ?? "Something went wrong")
      return
    }

    // Patch the JWT cookie so the new organizationId is included, then hard-reload
    await update({ organizationId: body.data.organizationId, orgRole: "OWNER" })
    window.location.href = "/dashboard"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">Z</span>
            </div>
            <span className="font-semibold text-xl">ZenFlow</span>
          </div>
          <h1 className="text-2xl font-bold">Set up your organisation</h1>
          <p className="text-muted-foreground mt-1">Tell us about your business to get started</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Company details</CardTitle>
              <CardDescription>You can update these at any time in Settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Company name <span className="text-destructive">*</span></Label>
                <Input id="name" placeholder="Acme (Pty) Ltd" {...register("name")} />
                {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_reg_no">Company registration no.</Label>
                  <Input id="company_reg_no" placeholder="2023/123456/07" {...register("company_reg_no")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat_number">VAT number</Label>
                  <Input id="vat_number" placeholder="4123456789" {...register("vat_number")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Business email</Label>
                  <Input id="email" type="email" placeholder="info@acme.co.za" {...register("email")} />
                  {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input id="phone" placeholder="+27 11 123 4567" {...register("phone")} />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Setting up..." : "Continue to dashboard"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
