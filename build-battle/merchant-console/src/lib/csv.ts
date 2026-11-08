import { merchantById } from "@/data/merchants"
import { Payment } from "@/data/types"
import { formatMoney } from "./money"

/**
 * CSV export for the payments table.
 *
 * Ops chooses the columns and the scope (NWP-101). Column names arrive from
 * the client, so the route parses them through `parseExportColumns`, which
 * only ever returns names from `EXPORT_COLUMNS`. The card last four is off
 * by default because most files end up with a merchant.
 */

export const EXPORT_COLUMNS = [
  "id",
  "created_at",
  "merchant",
  "description",
  "status",
  "method",
  "card_brand",
  "last4",
  "amount",
  "currency",
] as const

export type ExportColumn = (typeof EXPORT_COLUMNS)[number]

/** What an export contains when ops does not say otherwise: everything but last4. */
export const DEFAULT_EXPORT_COLUMNS: readonly ExportColumn[] = EXPORT_COLUMNS.filter(
  (column) => column !== "last4",
)

function isExportColumn(value: string): value is ExportColumn {
  return (EXPORT_COLUMNS as readonly string[]).includes(value)
}

/**
 * Parse the `columns` query param.
 *
 * - `null` (param absent) → the defaults
 * - a comma-separated list → those columns, in the order given, deduplicated
 * - an empty list → `[]`, so the caller can refuse to write an empty file
 * - any name outside the allowlist → `null`, so the caller can reject it
 */
export function parseExportColumns(
  raw: string | null,
): ExportColumn[] | null {
  if (raw === null) return [...DEFAULT_EXPORT_COLUMNS]

  const columns: ExportColumn[] = []
  for (const name of raw.split(",").map((part) => part.trim())) {
    if (name === "") continue
    if (!isExportColumn(name)) return null
    if (!columns.includes(name)) columns.push(name)
  }
  return columns
}

export const EXPORT_SCOPES = ["filter", "all"] as const

export type ExportScope = (typeof EXPORT_SCOPES)[number]

/** Parse the `scope` query param. Anything but `all` means the current filter. */
export function parseExportScope(raw: string | null): ExportScope {
  return raw === "all" ? "all" : "filter"
}

/**
 * The scope word in the filename: `all`, the status when the current filter
 * has one, otherwise `filtered`. Both inputs are already allowlisted, so the
 * result is safe to put in a header.
 */
export function exportScopeLabel(
  scope: ExportScope,
  status: string | undefined,
): string {
  if (scope === "all") return "all"
  if (status && status !== "all") return status
  return "filtered"
}

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function cell(payment: Payment, column: ExportColumn): string {
  switch (column) {
    case "id":
      return payment.id
    case "created_at":
      return payment.createdAt
    case "merchant":
      return merchantById(payment.merchantId)?.name ?? payment.merchantId
    case "description":
      return payment.description
    case "status":
      return payment.status
    case "method":
      return payment.method
    case "card_brand":
      return payment.cardBrand ?? ""
    case "last4":
      return payment.last4 ?? ""
    case "amount":
      return formatMoney(payment.amount, payment.currency)
    case "currency":
      return payment.currency
  }
}

export function toCsv(
  payments: Payment[],
  columns: readonly ExportColumn[] = EXPORT_COLUMNS,
): string {
  const header = columns.join(",")
  const rows = payments.map((payment) =>
    columns.map((column) => escapeCell(cell(payment, column))).join(","),
  )
  return [header, ...rows].join("\n")
}

/** `payments-<scope>-<utc date>.csv`; without a scope label, `payments-<utc date>.csv`. */
export function exportFilename(date = new Date(), scopeLabel?: string): string {
  const day = date.toISOString().slice(0, 10)
  return scopeLabel ? `payments-${scopeLabel}-${day}.csv` : `payments-${day}.csv`
}
