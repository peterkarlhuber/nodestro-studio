// Rows of a batch from a parsed table: the same mapping rules as the backend (batches.rows_from_records).

import type { BatchRow } from "../api/types";

/** ``mapping``: column -> form field name, or "input" for the free-text input. */
export function rowsFromRecords(records: Record<string, string>[], mapping: Record<string, string>): BatchRow[] {
  const mapped = Object.values(mapping).some(Boolean);
  return records.map((record) => {
    const row: BatchRow = { values: {}, input: "", file_ids: [] };
    const extra: string[] = [];
    for (const [column, value] of Object.entries(record)) {
      const target = mapping[column];
      if (target === "input") row.input = row.input ? `${row.input}\n${value}`.trim() : value;
      else if (target) row.values[target] = value;
      else if (value && !mapped) extra.push(`${column}: ${value}`);
    }
    if (extra.length) row.input = extra.join("\n");
    return row;
  });
}

/** Share of finished items, 0..1. */
export function progress(counts: { total: number; succeeded: number; failed: number; cancelled: number; skipped: number; invalid: number }): number {
  if (!counts.total) return 0;
  return (counts.succeeded + counts.failed + counts.cancelled + counts.skipped + counts.invalid) / counts.total;
}
