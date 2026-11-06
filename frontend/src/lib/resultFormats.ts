// The result file formats, in one place: the editor's result node, the "Create file" dialog of a run and the file
// list take their options, labels, extensions and the preview from here. This mirrors the runtime's table
// (nodestro_runtime.reports.REPORT_FORMATS); tests/test_result_formats.py compares both, so a format added there
// cannot be missing here. The ids are stored in workflows and runs and never change.

import type { TFunction } from "i18next";

import type { ReportFormat } from "../api/types";

export interface ResultFormatInfo {
  id: ReportFormat;
  /** The file name extension, without dot. */
  extension: string;
  /** The Content-Type the backend sends. */
  mediaType: string;
  /** Whether the run's file list can show the file in the page (Markdown, HTML without scripts, PDF). */
  preview: boolean;
}

export const RESULT_FORMATS = [
  { id: "md", extension: "md", mediaType: "text/markdown; charset=utf-8", preview: true },
  { id: "json", extension: "json", mediaType: "application/json", preview: false },
  { id: "csv", extension: "csv", mediaType: "text/csv; charset=utf-8", preview: false },
  { id: "html", extension: "html", mediaType: "text/html; charset=utf-8", preview: true },
  { id: "pdf", extension: "pdf", mediaType: "application/pdf", preview: true },
  {
    id: "docx",
    extension: "docx",
    mediaType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    preview: false,
  },
  {
    id: "xlsx",
    extension: "xlsx",
    mediaType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    preview: false,
  },
] as const satisfies readonly ResultFormatInfo[];

// Every ReportFormat of the API types has an entry, and no entry is unknown to it (a compile error otherwise).
type Listed = (typeof RESULT_FORMATS)[number]["id"];
const EXHAUSTIVE: [ReportFormat] extends [Listed] ? ([Listed] extends [ReportFormat] ? true : never) : never = true;
void EXHAUSTIVE;

export const RESULT_FORMAT_IDS: readonly ReportFormat[] = RESULT_FORMATS.map((format) => format.id);

export function isResultFormat(value: unknown): value is ReportFormat {
  return typeof value === "string" && (RESULT_FORMAT_IDS as readonly string[]).includes(value);
}

export function resultFormat(id: string): ResultFormatInfo | undefined {
  return RESULT_FORMATS.find((format) => format.id === id);
}

/** "Word document (.docx)": the name of a format in the interface language. */
export function resultFormatLabel(t: TFunction, id: ReportFormat): string {
  return t(`flow.files.formats.${id}`);
}

/** The options of a format picker, in the order of the table. */
export function resultFormatOptions(t: TFunction): { value: ReportFormat; label: string }[] {
  return RESULT_FORMATS.map((format) => ({ value: format.id, label: resultFormatLabel(t, format.id) }));
}

/** Whether a file of this format can be shown in the page instead of only downloaded. */
export function canPreview(id: string): boolean {
  return resultFormat(id)?.preview ?? false;
}
