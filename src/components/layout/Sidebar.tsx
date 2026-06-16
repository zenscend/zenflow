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
    <aside className="w-64 shrink-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-md bg-brand flex items-center justify-center shrink-0">
          <span className="text-brand-foreground font-bold text-sm font-mono">Z</span>
        </div>
        <span className="font-semibold text-lg font-heading tracking-tight">ZenFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium font-mono tracking-tight transition-colors",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto text-brand/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pt-3 pb-2 border-t border-sidebar-border space-y-0.5">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium font-mono tracking-tight transition-colors",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Powered by Zenscend */}
      <div className="px-5 pb-4 pt-2">
        <p className="text-[9px] font-mono uppercase tracking-widest text-sidebar-foreground/30 mb-0.5">
          Powered by
        </p>
        <a
          href="https://zenscend.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono font-medium text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
        >
          zenscend.co
        </a>
      </div>
    </aside>
  )
}
