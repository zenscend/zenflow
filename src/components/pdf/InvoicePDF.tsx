import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer"

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  black:   "#000000",
  dark:    "#1a1a1a",
  grey:    "#666666",
  light:   "#999999",
  border:  "#e0e0e0",
  tableHd: "#f4f4f4",
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 50,
    paddingBottom: 56,
    paddingHorizontal: 50,
    color: C.dark,
    backgroundColor: "#ffffff",
  },

  // Header row
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  docTitle: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: C.black,
    letterSpacing: 0.5,
  },

  // Divider
  divider: { borderBottomWidth: 0.5, borderBottomColor: C.border },

  // From / To info rows
  infoRow: {
    flexDirection: "row",
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  infoLabel: { width: 90, fontSize: 9, color: C.grey },
  infoValue: { flex: 1, fontSize: 9, color: C.dark },
  infoValueBold: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark },

  // Invoice meta
  metaBlock: { marginTop: 4, marginBottom: 20 },
  metaRow: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  metaLabel: { width: 90, fontSize: 9, color: C.grey },
  metaValue: { fontSize: 9, color: C.dark },

  // Table
  table: { marginBottom: 2 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.tableHd,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.grey },
  tdText: { fontSize: 9, color: C.dark },

  cDesc:   { flex: 3 },
  cQty:    { flex: 0.6, textAlign: "center" },
  cUnit:   { flex: 1.6, textAlign: "right" },
  cVat:    { flex: 1.6, textAlign: "right" },
  cAmount: { flex: 1.6, textAlign: "right" },

  // Totals
  totalsOuter: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10, marginBottom: 18 },
  totalsBox:   { width: 250 },
  totalsRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalsLabel: { fontSize: 9, color: C.grey },
  totalsValue: { fontSize: 9, color: C.dark },
  totalFinal:  {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  totalFinalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.black },
  totalFinalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.black },

  // Banking
  bankSection: { paddingTop: 14, borderTopWidth: 0.5, borderTopColor: C.border },
  bankTitle:   { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 10 },
  bankRow:     { flexDirection: "row", marginBottom: 5 },
  bankLabel:   { width: 110, fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark },
  bankValue:   { fontSize: 9, color: C.dark },

  // Notes
  notesBox:   { marginTop: 14 },
  notesLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.grey, marginBottom: 3, textTransform: "uppercase" },
  notesText:  { fontSize: 9, color: C.dark, lineHeight: 1.6 },

  // SARS
  sarsNote: { marginTop: 14, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: C.border },
  sarsText: { fontSize: 7, color: C.light, textAlign: "center", lineHeight: 1.5 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 22,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerText: { fontSize: 7.5, color: C.light },
})

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt(v: any): string {
  const n = typeof v === "object" && v !== null && "toNumber" in v ? v.toNumber() : Number(v)
  return "R " + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
function fmtDate(d: any): string {
  return new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
}

// ── Zenscend Z-mark (icon only from the full wordmark SVG) ─────────────────
const ICON_PATH =
  "M23.29,48.35c0,6.8,0,13.59,0,20.39h6.78v-6.78h6.78v-6.78h6.78v-6.83h-20.36Z" +
  "M40.26,21.25l-16.96,13.57h47.5c0,4.53,0,9.06,0,13.58-2.27,0-4.53-.01-6.8-.02" +
  "v6.78h-6.78v6.78h-6.78v6.78h20.32v2.4c.02,1.44.03,2.88.05,4.32v6.86" +
  "c4.52-5.65,9.05-11.31,13.57-16.96V21.25h-44.11Z"

function ZenscendMark({ size = 42 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="16 18 72 76">
      <Path d={ICON_PATH} fill="#000000" fillRule="evenodd" />
    </Svg>
  )
}

// ── Component ────────────────────────────────────────────────────────────────
interface InvoicePDFProps {
  invoice: any
  organization: any
}

export function InvoicePDF({ invoice, organization }: InvoicePDFProps) {
  const lineItems: any[] = invoice.line_items ?? []
  const hasBankDetails = organization.bank_name || organization.bank_account_no
  const isVatRegistered  = !!organization.vat_number
  const docTitle = isVatRegistered ? "TAX INVOICE" : "INVOICE"

  const customer = invoice.customer
  const customerAddress = [
    customer.address_line_1,
    customer.address_line_2,
    customer.city,
    customer.province,
    customer.postal_code,
    "South Africa",
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <Document title={`${docTitle} ${invoice.invoice_number}`}>
      <Page size="A4" style={s.page}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.docTitle}>{docTitle}</Text>
          <ZenscendMark size={44} />
        </View>

        <View style={s.divider} />

        {/* ── From ───────────────────────────────────────────────────── */}
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>From</Text>
          <Text style={s.infoValueBold}>{(organization.trading_name || organization.name).toUpperCase()}</Text>
        </View>

        {/* ── To / Address ───────────────────────────────────────────── */}
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>To</Text>
          <Text style={s.infoValueBold}>{customer.display_name}</Text>
        </View>
        {customerAddress ? (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Address</Text>
            <Text style={s.infoValue}>{customerAddress}</Text>
          </View>
        ) : null}
        {customer.vat_number ? (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>VAT Reg No</Text>
            <Text style={s.infoValue}>{customer.vat_number}</Text>
          </View>
        ) : null}

        {/* ── Invoice meta ────────────────────────────────────────────── */}
        <View style={s.metaBlock}>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Invoice #</Text>
            <Text style={s.metaValue}>{invoice.invoice_number}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Issued Date</Text>
            <Text style={s.metaValue}>{fmtDate(invoice.issue_date)}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Due Date</Text>
            <Text style={s.metaValue}>{fmtDate(invoice.due_date)}</Text>
          </View>
          {invoice.title ? (
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Subject</Text>
              <Text style={s.metaValue}>{invoice.title}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Line items ──────────────────────────────────────────────── */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.cDesc]}>Description</Text>
            <Text style={[s.thText, s.cQty]}>Qty</Text>
            <Text style={[s.thText, s.cUnit]}>Unit</Text>
            <Text style={[s.thText, s.cVat]}>VAT</Text>
            <Text style={[s.thText, s.cAmount]}>Amount</Text>
          </View>

          {lineItems.map((item, i) => (
            <View key={item.id ?? i} style={s.tableRow}>
              <Text style={[s.tdText, s.cDesc]}>{item.description}</Text>
              <Text style={[s.tdText, s.cQty]}>{Number(item.quantity)}</Text>
              <Text style={[s.tdText, s.cUnit]}>{fmt(item.unit_price)}</Text>
              <Text style={[s.tdText, s.cVat]}>
                {item.is_taxable ? fmt(item.vat_amount) : "R 0.00"}
              </Text>
              <Text style={[s.tdText, s.cAmount]}>{fmt(item.line_total)}</Text>
            </View>
          ))}
        </View>

        {/* ── Totals ──────────────────────────────────────────────────── */}
        <View style={s.totalsOuter}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{fmt(invoice.subtotal)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>VAT</Text>
              <Text style={s.totalsValue}>{fmt(invoice.vat_amount)}</Text>
            </View>
            <View style={s.totalFinal}>
              <Text style={s.totalFinalLabel}>Total</Text>
              <Text style={s.totalFinalValue}>{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Notes ───────────────────────────────────────────────────── */}
        {invoice.notes ? (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* ── Banking Details ──────────────────────────────────────────── */}
        {hasBankDetails && (
          <View style={s.bankSection}>
            <Text style={s.bankTitle}>Banking Details</Text>
            {organization.bank_name && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Bank Name</Text>
                <Text style={s.bankValue}>{organization.bank_name}</Text>
              </View>
            )}
            {organization.bank_account_name && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Account Name</Text>
                <Text style={s.bankValue}>{organization.bank_account_name}</Text>
              </View>
            )}
            {organization.bank_account_no && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Account Number</Text>
                <Text style={s.bankValue}>{organization.bank_account_no}</Text>
              </View>
            )}
            {organization.bank_account_type && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Account Type</Text>
                <Text style={s.bankValue}>
                  {organization.bank_account_type.charAt(0) + organization.bank_account_type.slice(1).toLowerCase()}
                </Text>
              </View>
            )}
            {organization.bank_branch_code && (
              <View style={s.bankRow}>
                <Text style={s.bankLabel}>Branch Code</Text>
                <Text style={s.bankValue}>{organization.bank_branch_code}</Text>
              </View>
            )}
            <View style={s.bankRow}>
              <Text style={s.bankLabel}>Payment Reference</Text>
              <Text style={[s.bankValue, { fontFamily: "Helvetica-Bold" }]}>
                {invoice.payment_reference || invoice.invoice_number}
              </Text>
            </View>
          </View>
        )}

        {/* ── SARS compliance note ─────────────────────────────────────── */}
        {isVatRegistered && (
          <View style={s.sarsNote}>
            <Text style={s.sarsText}>
              This is a valid Tax Invoice for VAT purposes as required by the Value-Added Tax Act, 89 of 1991 (South Africa).
              {` Supplier VAT Reg No: ${organization.vat_number}.`}
            </Text>
          </View>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {organization.name}
            {organization.vat_number ? ` · VAT ${organization.vat_number}` : ""}
            {organization.company_reg_no ? ` · Reg ${organization.company_reg_no}` : ""}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}
