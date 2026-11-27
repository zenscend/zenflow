/**
 * One-off migration for Mlumbi Security Services: carry the invoice numbering
 * run over from the Excel billing sheets, and import the clients billed in
 * October 2026 (invoices 1663–1682) as customers.
 *
 *   pnpm db:migrate-mss            # dry run, prints what would change
 *   pnpm db:migrate-mss --apply    # writes
 *
 * Source: ~/Documents/Security/Billing/*.xlsx, transcribed by hand. The sheets
 * are hand-edited and structurally inconsistent (line items start at row 23,
 * 24 or 26; VAT lives in D36, E35 or a literal "NO VAT"), so transcription is
 * both shorter and more reliable than parsing them.
 */
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const ORG_ID = "fafc7fbd-5eaf-40e2-81f8-e8ae32191e2d" // MSS, owner bongani@mlumbisecurity.co.za

/** October 2026 ended at invoice 1682, so zenflow starts at 1683. */
const NEXT_INVOICE_NO = 1683

/** Shared by every New Leaf site — one bill per site, one contact for all. */
const NEW_LEAF = {
  phone: "074 799 7303",
  email: "info@propertyboss365.co.za",
  notes: "Contact: Mitchelle and Riad\nAlso: admin@propertyboss365.co.za",
}

type Record = {
  /** Existing display_name this record takes over, when it differs. */
  replaces?: string
  display_name: string
  type?: "BUSINESS" | "INDIVIDUAL"
  company_name?: string
  trading_name?: string
  vat_number?: string
  email?: string
  phone?: string
  alternate_phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  postal_code?: string
  notes?: string
}

const CUSTOMERS: Record[] = [
  {
    display_name: "Churston Engineering",
    company_name: "Churston Engineering",
    trading_name: "Churston Eng.",
    email: "dinob.teg@gmail.com",
    phone: "072 276 4434",
    address_line_1: "7 Preddy Street",
    address_line_2: "Germiston South",
    city: "Germiston",
    notes: "Contact: Dino Bruzzone",
  },
  {
    display_name: "EJARADINI LIFESTYLE",
    company_name: "Ejaradini Lifestyle",
    email: "silingene.nontobeko@icloud.com",
    phone: "0672704825",
    address_line_1: "Rietfontein Road",
    address_line_2: "Primrose",
    city: "Germiston",
    notes: "Contact: Silingene Nontobeko",
  },
  {
    display_name: "Eudora Market Pretoria North",
    company_name: "Eudora Market",
    email: "UTONGPTY@QQ.COM",
    phone: "081 851 6278",
    address_line_1: "C/O Emily Hobhouse Ave. and Gerrit Maritz Rd",
    city: "Pretoria North",
    notes: "Contact: Tony",
  },
  {
    display_name: "Jenny",
    type: "INDIVIDUAL",
    email: "silingene.nontobeko@icloud.com",
    phone: "074 915 4962",
    address_line_1: "Old ABSA Building",
    address_line_2: "610 Voortrekker Street",
    city: "Brakpan",
    notes: "Contact: Silingene Nontobeko",
  },
  {
    replaces: "LSG",
    display_name: "LSG Machine Tools",
    company_name: "Collateral Trading 280 cc",
    trading_name: "LSG Machine Tools",
    vat_number: "4920248749",
    email: "info@lsgmts.co.za",
    phone: "0727298355",
    address_line_1: "c/o Euclid and Tide Street",
    address_line_2: "Germiston Ext. 3",
    city: "Germiston",
    postal_code: "1401",
    notes: "Contact: Serg\nAlso: executive.assistant@lsgmts.co.za, finance.m@lsgmts.co.za",
  },
  {
    display_name: "MKA Trucking",
    company_name: "MKA Trucking (Pty) Ltd",
    vat_number: "4540231406",
    email: "mkatrucking@mweb.co.za",
    phone: "0822160786",
    address_line_1: "15 Arkin Street",
    city: "Germiston",
    notes: "Contact: MOE",
  },
  {
    display_name: "New Leaf P I — Alrode",
    company_name: "New Leaf Property Investment (Pty) Ltd",
    address_line_1: "21 Diens Street",
    address_line_2: "Alrode",
    city: "Alberton",
    ...NEW_LEAF,
  },
  {
    display_name: "New Leaf P I — Factoria",
    company_name: "Silver Meadow Properties 142 (Pty) Ltd",
    address_line_1: "C/O Voortrekker and Shannon",
    city: "Factoria",
    ...NEW_LEAF,
  },
  {
    display_name: "New Leaf P I — Germiston",
    company_name: "New Leaf Property Investment (Pty) Ltd",
    vat_number: "4830154300",
    address_line_1: "70 Lower Boksburg Road, Unit 2 and 3",
    city: "Germiston",
    postal_code: "1401",
    ...NEW_LEAF,
  },
  {
    display_name: "New Leaf P I — Laser Park",
    company_name: "French Riviera Investment (Pty) Ltd",
    address_line_1: "Silver Birch Office Park",
    address_line_2: "Laser Park",
    ...NEW_LEAF,
  },
  {
    display_name: "New Leaf P I — Longdale",
    company_name: "French Riviera Investment (Pty) Ltd",
    address_line_1: "C/O Springbok and Longdale Road",
    address_line_2: "Longdale Industrial",
    ...NEW_LEAF,
  },
  {
    display_name: "New Leaf P I — Monument",
    company_name: "French Riviera Investments (Pty) Ltd",
    address_line_1: "Monument Mall",
    city: "Krugersdorp",
    ...NEW_LEAF,
  },
  {
    display_name: "New Leaf P I — Riverview",
    company_name: "French Riviera Investment (Pty) Ltd",
    address_line_1: "River View Mall",
    address_line_2: "C/O Krugerrand and Florin Road",
    city: "Strubensvalley",
    ...NEW_LEAF,
  },
  {
    display_name: "PTF Mnf.",
    company_name: "PTF Mnf.",
    vat_number: "4950204919",
    email: "johan@ptf.co.za",
    phone: "066 412 0807",
    address_line_1: "17 Miller Street",
    city: "Germiston Industries",
    notes: "Contact: Johan Jr\nAlso: hester@ptf.co.za",
  },
  {
    display_name: "Roxana Fruit Market",
    company_name: "Bravoscan 268 cc",
    trading_name: "Roxana Fruit Market",
    vat_number: "4870239738",
    email: "roxanafruit1@gmail.com",
    phone: "0836255092",
    address_line_1: "18 Webber Road",
    address_line_2: "Germiston South",
    city: "Germiston",
    postal_code: "1401",
    notes: "Contact: Thomas",
  },
  {
    display_name: "SA Cotton Waste",
    company_name: "SA Cotton Waste",
    vat_number: "4590101152",
    email: "nwallis@mweb.co.za",
    phone: "082 441 4620",
    alternate_phone: "082 448 6877",
    address_line_1: "474 Barlow Road",
    city: "Germiston Industries",
    notes: "Contact: Norman and Shirl Wallis",
  },
  {
    display_name: "Southern Butchery",
    company_name: "Southern Butchery",
    email: "southernbutchery2018@gmail.com",
    phone: "0716792675",
    address_line_1: "c/o Angus and Webber Road",
    address_line_2: "Germiston South",
    city: "Germiston",
    postal_code: "1401",
    notes: "Contact: Bruno",
  },
  {
    display_name: "Southern Spar",
    company_name: "Southern Spar",
    email: "karlien@southernspar.com",
    phone: "0824643449",
    address_line_1: "c/o Angus and Webber Road",
    address_line_2: "Germiston South",
    city: "Germiston",
    postal_code: "1401",
    notes: "Contact: Michael",
  },
  {
    display_name: "Swasap (Pty) Ltd",
    company_name: "Swasap (Pty) Ltd",
    vat_number: "4490206234",
    email: "sonia@swasap.com",
    phone: "0823471599",
    address_line_1: "4 Rinkhals Street",
    city: "Germiston",
    postal_code: "1401",
    notes: "Contact: Sonia Walker\nAlso: debbie@swasap.com",
  },
  {
    display_name: "Tops @ Spar",
    company_name: "Byntrade 54 cc",
    trading_name: "Tops @ Spar",
    email: "karlien@southernspar.com",
    phone: "0824643449",
    address_line_1: "c/o Angus and Webber Road",
    address_line_2: "Germiston South",
    city: "Germiston",
    postal_code: "1401",
    notes: "Contact: Michael",
  },
]

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

/** Record → customer row. The sheets are all Gauteng; blanks stay null. */
function toRow({ replaces, ...r }: Record) {
  return {
    organisation_id: ORG_ID,
    type: r.type ?? ("BUSINESS" as const),
    display_name: r.display_name,
    company_name: r.company_name ?? null,
    trading_name: r.trading_name ?? null,
    vat_number: r.vat_number ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    alternate_phone: r.alternate_phone ?? null,
    address_line_1: r.address_line_1 ?? null,
    address_line_2: r.address_line_2 ?? null,
    city: r.city ?? null,
    province: "GAUTENG" as const,
    postal_code: r.postal_code ?? null,
    notes: r.notes ?? null,
    is_active: true,
  }
}

async function main() {
  const apply = process.argv.includes("--apply")

  const org = await prisma.organisation.findUnique({
    where: { id: ORG_ID },
    select: { name: true, invoice_prefix: true, next_invoice_no: true },
  })
  if (!org) throw new Error(`Organisation ${ORG_ID} not found`)

  // Match on display_name so a re-run updates rather than duplicates. Names
  // are few and already distinct, so the in-memory scan beats 20 queries.
  const existing = await prisma.customer.findMany({
    where: { organisation_id: ORG_ID },
    select: { id: true, display_name: true },
  })
  const byName = new Map(existing.map((c) => [c.display_name.trim().toLowerCase(), c.id]))
  const find = (r: Record) =>
    byName.get(r.display_name.trim().toLowerCase()) ??
    (r.replaces ? byName.get(r.replaces.trim().toLowerCase()) : undefined)

  const creates = CUSTOMERS.filter((r) => !find(r))
  const updates = CUSTOMERS.filter((r) => find(r))

  console.log(`org: ${org.name} (${ORG_ID})`)
  console.log(`invoice counter: ${org.next_invoice_no} → ${NEXT_INVOICE_NO} (next: ${org.invoice_prefix}-${NEXT_INVOICE_NO})`)
  console.log(`customers: ${creates.length} create, ${updates.length} update`)
  for (const r of creates) console.log(`  + ${r.display_name}`)
  for (const r of updates) console.log(`  ~ ${r.display_name}${r.replaces ? ` (was "${r.replaces}")` : ""}`)

  if (!apply) {
    console.log("\ndry run — nothing written. Re-run with --apply to commit.")
    return
  }

  await prisma.$transaction(async (tx) => {
    for (const r of CUSTOMERS) {
      const id = find(r)
      if (id) await tx.customer.update({ where: { id }, data: toRow(r) })
      else await tx.customer.create({ data: toRow(r) })
    }
    await tx.organisation.update({
      where: { id: ORG_ID },
      data: { next_invoice_no: NEXT_INVOICE_NO },
    })
  })

  console.log("\n✓ applied")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
