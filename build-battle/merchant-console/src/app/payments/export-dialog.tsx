"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import {
  DEFAULT_EXPORT_COLUMNS,
  EXPORT_COLUMNS,
  ExportColumn,
  ExportScope,
} from "@/lib/csv"
import { Download } from "lucide-react"
import { useState } from "react"

const COLUMN_LABELS: Record<ExportColumn, string> = {
  id: "Payment ID",
  created_at: "Created at",
  merchant: "Merchant",
  description: "Description",
  status: "Status",
  method: "Method",
  card_brand: "Card brand",
  last4: "Card last four",
  amount: "Amount",
  currency: "Currency",
}

/**
 * Export options for the payments table.
 *
 * The dialog only decides what to ask for. Row selection, column validation,
 * and the file itself all happen in `/api/payments/export`, so the export is
 * never limited to the page currently on screen.
 */
export function ExportDialog({
  query,
  filteredCount,
  allCount,
}: {
  /** The current filter params, without `page`. */
  query: string
  filteredCount: number
  allCount: number
}) {
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState<ExportScope>("filter")
  const [columns, setColumns] = useState<ExportColumn[]>([
    ...DEFAULT_EXPORT_COLUMNS,
  ])

  const rowCount = scope === "all" ? allCount : filteredCount
  const nothingSelected = columns.length === 0

  const toggle = (column: ExportColumn, checked: boolean) => {
    setColumns((current) =>
      checked
        ? EXPORT_COLUMNS.filter((c) => c === column || current.includes(c))
        : current.filter((c) => c !== column),
    )
  }

  const params = new URLSearchParams(query)
  params.set("scope", scope)
  params.set("columns", columns.join(","))
  const href = `/api/payments/export?${params.toString()}`

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Download
            className="-ml-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          Export
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Export payments</DrawerTitle>
          <DrawerDescription>
            Choose what goes in the file. Card last four is off unless you turn
            it on.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="flex flex-col gap-6">
          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Scope
            </legend>
            <div className="mt-2 flex flex-col gap-2">
              <ScopeOption
                value="filter"
                current={scope}
                onChange={setScope}
                label="Current filter"
                count={filteredCount}
              />
              <ScopeOption
                value="all"
                current={scope}
                onChange={setScope}
                label="All payments"
                count={allCount}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Columns
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EXPORT_COLUMNS.map((column) => (
                <label
                  key={column}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    name="columns"
                    value={column}
                    checked={columns.includes(column)}
                    onChange={(event) => toggle(column, event.target.checked)}
                    className="size-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 dark:border-gray-700"
                  />
                  {COLUMN_LABELS[column]}
                </label>
              ))}
            </div>
            {nothingSelected && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                Select at least one column to download.
              </p>
            )}
          </fieldset>

          <p className="text-sm text-gray-500" aria-live="polite">
            {rowCount.toLocaleString()} {rowCount === 1 ? "row" : "rows"} will be
            exported.
          </p>
        </DrawerBody>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary" className="mt-2 w-full sm:mt-0 sm:w-fit">
              Cancel
            </Button>
          </DrawerClose>
          {nothingSelected ? (
            <Button className="w-full sm:w-fit" disabled>
              Download
            </Button>
          ) : (
            <Button className="w-full sm:w-fit" asChild>
              <a href={href} download onClick={() => setOpen(false)}>
                Download
              </a>
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function ScopeOption({
  value,
  current,
  onChange,
  label,
  count,
}: {
  value: ExportScope
  current: ExportScope
  onChange: (scope: ExportScope) => void
  label: string
  count: number
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
      <input
        type="radio"
        name="scope"
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
        className="size-4 border-gray-300 text-blue-500 focus:ring-blue-500 dark:border-gray-700"
      />
      <span>
        {label}{" "}
        <span className="text-gray-500">
          ({count.toLocaleString()} {count === 1 ? "row" : "rows"})
        </span>
      </span>
    </label>
  )
}
