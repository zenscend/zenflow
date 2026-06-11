import { supabaseServer } from "@/utils/supabase/server"

export const LOGOS_BUCKET = "logos"

export const storageServer = () => supabaseServer().storage
