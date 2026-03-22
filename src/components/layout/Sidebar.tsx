"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Receipt,
  Settings,
  ChevronRight,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products & Services", icon: Package },
]

const bottomItems = [
  { href: "/company", label: "Company Settings", icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-200">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-sm">Z</span>
        </div>
        <span className="font-semibold text-lg">ZenFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
