/**
 * Next quote/invoice number for an org. Must run inside a transaction.
 *
 * The organisation update runs first and holds a row lock for the rest of the
 * transaction, so concurrent creates for one org serialise behind it.
 *
 * Self-healing: quote_number/invoice_number can be edited directly in the DB,
 * which leaves the stored counter pointing at a number that already exists.
 * That trips the (organisation_id, number) unique index and breaks every
 * subsequent create, so take the highest number actually in use as the floor.
 */
export async function nextDocNumber(tx: any, orgId: string, kind: "quote" | "invoice") {
  const counterField = kind === "quote" ? "next_quote_no" : "next_invoice_no"
  const prefixField = kind === "quote" ? "quote_prefix" : "invoice_prefix"
  const numberField = `${kind}_number`

  const org = await tx.organisation.update({
    where: { id: orgId },
    data: { [counterField]: { increment: 1 } },
  })

  const prefix = org[prefixField]
  let n = org[counterField] - 1

  // ponytail: string ordering, correct while every number is 4-digit zero
  // padded. Past 9999, order by a regex + ::int cast in raw SQL instead.
  const last = await tx[kind].findFirst({
    where: { organisation_id: orgId, [numberField]: { startsWith: `${prefix}-` } },
    orderBy: { [numberField]: "desc" },
    select: { [numberField]: true },
  })
  const highest = Number.parseInt(last?.[numberField].slice(prefix.length + 1), 10) || 0

  if (highest >= n) {
    n = highest + 1
    await tx.organisation.update({ where: { id: orgId }, data: { [counterField]: n + 1 } })
  }

  return { org, number: `${prefix}-${String(n).padStart(4, "0")}` }
}
