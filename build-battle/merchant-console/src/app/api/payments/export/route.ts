import { filterPayments, parseFilters, sortPayments } from "@/data/queries"
import {
  exportFilename,
  exportScopeLabel,
  parseExportColumns,
  parseExportScope,
  toCsv,
} from "@/lib/csv"
import { NextRequest, NextResponse } from "next/server"

/**
 * Exports the payments table as CSV.
 *
 * Query params, all optional:
 * - `columns` — comma-separated names from EXPORT_COLUMNS, in the order the
 *   file should have them. Absent means the defaults (no last four).
 * - `scope` — `filter` (default) honors the active filters; `all` exports
 *   every payment.
 * - the usual filter params, parsed by the same query builder as /api/payments.
 *
 * Everything from the client is allowlisted before it reaches a query or the
 * filename. Rows are selected on the server, so the export is never limited
 * to the page the table happens to be showing.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const columns = parseExportColumns(params.get("columns"))
  if (columns === null) {
    return NextResponse.json(
      { message: "Unknown export column." },
      { status: 400 },
    )
  }
  if (columns.length === 0) {
    return NextResponse.json(
      { message: "Choose at least one column to export." },
      { status: 400 },
    )
  }

  const scope = parseExportScope(params.get("scope"))
  const filters = parseFilters(params)
  const selected = scope === "all" ? filterPayments({}) : filterPayments(filters)
  const rows = sortPayments(selected, filters.sort, filters.direction)
  const filename = exportFilename(
    new Date(),
    exportScopeLabel(scope, filters.status),
  )

  return new Response(toCsv(rows, columns), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  })
}
