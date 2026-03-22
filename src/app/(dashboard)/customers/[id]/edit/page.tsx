import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import CustomerForm from "@/components/customers/CustomerForm"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, organization_id: session!.user.organizationId! },
  })

  if (!customer) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Customer</h1>
        <p className="text-muted-foreground text-sm mt-1">{customer.display_name}</p>
      </div>
      <CustomerForm
        customerId={id}
        defaultValues={{
          type: customer.type,
          display_name: customer.display_name,
          company_name: customer.company_name,
          trading_name: customer.trading_name,
          company_reg_no: customer.company_reg_no,
          vat_number: customer.vat_number,
          first_name: customer.first_name,
          last_name: customer.last_name,
          id_number: customer.id_number,
          email: customer.email,
          phone: customer.phone,
          alternate_phone: customer.alternate_phone,
          address_line_1: customer.address_line_1,
          address_line_2: customer.address_line_2,
          city: customer.city,
          province: customer.province,
          postal_code: customer.postal_code,
          notes: customer.notes,
        }}
      />
    </div>
  )
}
