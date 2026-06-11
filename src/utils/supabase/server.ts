import { createClient } from "@supabase/supabase-js"

// Server-side client using the service role key.
// Use this for storage operations in API routes and Server Actions.
// Never import this in client components.
export const supabaseServer = () =>
  createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
