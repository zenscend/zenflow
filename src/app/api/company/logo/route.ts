import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LOGOS_BUCKET, logoStoragePath, storageServer } from "@/lib/storage"

// @react-pdf/renderer's <Image> can't rasterise SVG, so an SVG logo would
// render as a blank header. Reject it here rather than silently on the PDF.
const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
}
const MAX_BYTES = 2 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.organisationId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }
  const orgId = session.user.organisationId

  const file = (await req.formData()).get("file")
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "No file uploaded" } },
      { status: 400 },
    )
  }

  const extension = EXTENSIONS[file.type]
  if (!extension) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Logo must be a PNG or JPG" } },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Logo must be 2MB or smaller" } },
      { status: 400 },
    )
  }

  const storage = storageServer().from(LOGOS_BUCKET)
  // Timestamped key so a replaced logo isn't served from a CDN cache.
  const path = `${orgId}/logo-${Date.now()}.${extension}`

  const { error } = await storage.upload(path, file, { contentType: file.type })
  if (error) {
    return NextResponse.json(
      { error: { code: "UPLOAD_FAILED", message: error.message } },
      { status: 502 },
    )
  }

  const previous = await prisma.organisation.findUnique({
    where: { id: orgId },
    select: { logo_url: true },
  })

  const logo_url = storage.getPublicUrl(path).data.publicUrl
  await prisma.organisation.update({ where: { id: orgId }, data: { logo_url } })

  const stale = logoStoragePath(previous?.logo_url)
  if (stale) await storage.remove([stale])

  return NextResponse.json({ data: { logo_url } })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user.organisationId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 })
  }
  const orgId = session.user.organisationId

  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    select: { logo_url: true },
  })

  await prisma.organisation.update({ where: { id: orgId }, data: { logo_url: null } })

  const path = logoStoragePath(org?.logo_url)
  if (path) await storageServer().from(LOGOS_BUCKET).remove([path])

  return NextResponse.json({ data: { logo_url: null } })
}
