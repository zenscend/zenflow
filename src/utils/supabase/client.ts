import { createBrowserClient } from "@supabase/ssr"

// Browser-side client using the publishable key.
// Stores the session in cookies so the server sees the same session.
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
