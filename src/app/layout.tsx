import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import AuthProvider from "@/components/layout/AuthProvider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "ZenFlow",
  description: "Revenue operations for South African businesses",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans">
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
