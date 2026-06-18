"use client"

import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Moon, Sun, User } from "lucide-react"

interface TopbarProps {
  orgName?: string
}

export default function Topbar({ orgName }: TopbarProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  const fullName = [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(" ")
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border shrink-0">
      <div>
        {orgName && (
          <p className="text-sm text-muted-foreground font-mono tracking-tight">
            <span className="font-medium text-foreground">{orgName}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-brand/10 text-brand text-xs font-semibold font-mono">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium font-mono leading-none">{fullName || session?.user?.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{session?.user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="h-4 w-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
