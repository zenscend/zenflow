import { supabaseServer } from "@/utils/supabase/server"

export const LOGOS_BUCKET = "logos"

export const storageServer = () => supabaseServer().storage

/**
 * The object path inside LOGOS_BUCKET for a stored public URL, or null if the
 * URL isn't one of ours. Used to delete the old file when a logo is replaced.
 */
export function logoStoragePath(publicUrl: string | null | undefined): string | null {
  if (!publicUrl) return null
  const marker = `/${LOGOS_BUCKET}/`
  const at = publicUrl.indexOf(marker)
  if (at === -1) return null
  return publicUrl.slice(at + marker.length) || null
}
