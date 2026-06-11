import { createClient } from "@supabase/supabase-js"

// Browser-side client using the publishable key.
// Safe to use in client components (e.g. direct-to-storage uploads).
export const supabaseBrowser = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
