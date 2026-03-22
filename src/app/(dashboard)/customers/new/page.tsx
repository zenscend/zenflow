import CustomerForm from "@/components/customers/CustomerForm"

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Customer</h1>
        <p className="text-muted-foreground text-sm mt-1">Add a new customer to your account</p>
      </div>
      <CustomerForm />
    </div>
  )
}
