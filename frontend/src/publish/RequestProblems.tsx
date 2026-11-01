// Readable field problems of a refused API request (AD-15). The API lists pydantic's paths, one per branch of a
// union ("values.qty.int", "values.qty.float" for one number field); here each field is named once, with its label
// and what is wrong ("Quantity: must be a number"). Backend item: collapse the branches with a code per field.

import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { ApiError } from "../api/client";

export interface FieldError {
  field: string;
  code: string;
  message?: string;
}

/** Path parts pydantic adds for the branches of a union or a validator, never a field name of a form. */
const BRANCH = /^(int|float|str|bool|bytes|none|decimal|date|datetime|list|dict|tuple|set|[a-z_-]+\[.*\])$/;

/** "values.qty.float" → "values.qty" */
export function fieldPath(field: string): string {
  const parts = field.split(".");
  while (parts.length > 1 && BRANCH.test(parts[parts.length - 1])) parts.pop();
  return parts.join(".");
}

const KINDS: [RegExp, string][] = [
  [/^missing$/, "missing"],
  [/^(int|float|decimal|number)_(parsing|type)$|^(int|float)_from_float$/, "number"],
  [/^bool_(parsing|type)$/, "boolean"],
  [/^string_(type|too_short|too_long)$/, "text"],
  [/^(date|datetime)_(parsing|type|from_datetime_parsing)$/, "date"],
  [/^extra_forbidden$/, "extra"],
  [/^(literal_error|enum)$/, "choice"],
  [/^(list_type|too_short|too_long)$/, "list"],
];

function kindOf(code: string): string {
  return KINDS.find(([pattern]) => pattern.test(code))?.[1] ?? "invalid";
}

/** One entry per field: a field that failed for several union branches is reported once, by its first kind. */
export function collapseFieldErrors(errors: FieldError[]): { path: string; kind: string; message?: string }[] {
  const seen = new Map<string, { path: string; kind: string; message?: string }>();
  for (const error of errors) {
    const path = fieldPath(error.field || "body");
    if (!seen.has(path)) seen.set(path, { path, kind: kindOf(error.code), message: error.message });
  }
  return [...seen.values()];
}

/** The form field labels from the OpenAPI document ("qty" → "Quantity"), when the schema carries titles. */
export function fieldLabels(openapi: unknown): Map<string, string> {
  const labels = new Map<string, string>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(visit);
    const record = value as Record<string, unknown>;
    const properties = record.properties;
    if (properties && typeof properties === "object" && !Array.isArray(properties))
      for (const [name, schema] of Object.entries(properties as Record<string, unknown>)) {
        const title = schema && typeof schema === "object" ? (schema as Record<string, unknown>).title : null;
        if (typeof title === "string" && title && !labels.has(name)) labels.set(name, title);
      }
    Object.values(record).forEach(visit);
  };
  visit(openapi);
  return labels;
}

export function fieldErrorsOf(error: unknown): FieldError[] | null {
  if (!(error instanceof ApiError) || error.code !== "request.invalid") return null;
  const errors = error.params.errors;
  if (!Array.isArray(errors) || !errors.length) return null;
  return errors.filter((item): item is FieldError => Boolean(item) && typeof item === "object" && typeof item.field === "string");
}

function label(t: TFunction, path: string, labels: Map<string, string>): string {
  const name = path.replace(/^values\./, "");
  if (path === "body" || path === "") return t("admin.request.body");
  return labels.get(name.split(".").pop() ?? name) ?? name;
}

/** The list under "The request does not fit the API's input". */
export function RequestProblems({ error, openapi }: { error: unknown; openapi?: unknown }) {
  const { t } = useTranslation();
  const errors = fieldErrorsOf(error);
  if (!errors) return null;
  const labels = fieldLabels(openapi);
  return (
    <ul className="small" data-testid="request-problems">
      {collapseFieldErrors(errors).map((item) => (
        <li key={item.path}>
          <strong>{label(t, item.path, labels)}</strong>: {t(`admin.request.kind.${item.kind}`)}
        </li>
      ))}
    </ul>
  );
}
