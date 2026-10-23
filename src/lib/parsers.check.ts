/**
 * Self-check for the two string parsers behind logo replacement and Google
 * profile linking. Run with: pnpm tsx src/lib/parsers.check.ts
 */
import assert from "node:assert/strict"
import { LOGOS_BUCKET, logoStoragePath } from "@/lib/storage"
import { splitFullName } from "@/lib/utils"

const base = `https://ref.supabase.co/storage/v1/object/public/${LOGOS_BUCKET}/`

// A stale logo must be deletable, or every replacement leaks a file.
assert.equal(logoStoragePath(`${base}org-1/logo-123.png`), "org-1/logo-123.png")
assert.equal(logoStoragePath(null), null)
assert.equal(logoStoragePath(undefined), null)
assert.equal(logoStoragePath(""), null)
// Not one of ours — never hand an arbitrary path to storage.remove().
assert.equal(logoStoragePath("https://evil.example/logo.png"), null)
assert.equal(logoStoragePath(base), null)

assert.deepEqual(splitFullName("Bongani Mlumbi"), {
  first_name: "Bongani",
  last_name: "Mlumbi",
})
assert.deepEqual(splitFullName("Ann Marie van Wyk"), {
  first_name: "Ann",
  last_name: "Marie van Wyk",
})
assert.deepEqual(splitFullName("Thabo"), { first_name: "Thabo", last_name: null })
// Google can omit the name entirely; columns are nullable, so stay null.
assert.deepEqual(splitFullName(undefined), { first_name: null, last_name: null })
assert.deepEqual(splitFullName("   "), { first_name: null, last_name: null })

console.log("parsers.check: ok")
