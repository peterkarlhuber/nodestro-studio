// The input form of a workflow, filled in when starting a run, in a schedule or in a test case.
// File fields take uploads (see FileInput) or knowledge files; an empty optional field stays empty.

import { useTranslation } from "react-i18next";

import { useRef } from "react";

import { ApiError } from "../api/client";
import type { FieldError, InputField } from "../api/types";
import { problemText } from "../lib/errors";
import { FileInput, type UploadOrigin } from "./FileInput";
import { Field, Select, TextArea, TextInput } from "./ui";

/** The per-field problems of a rejected start (``form.invalid``), by field name. */
export function fieldErrors(error: unknown): Record<string, FieldError> {
  if (!(error instanceof ApiError) || error.code !== "form.invalid") return {};
  const list = (error.params.errors as FieldError[] | undefined) ?? [];
  return Object.fromEntries(list.map((item) => [item.field, item]));
}

/** The preset values of a form (its defaults). */
export function formDefaults(fields: InputField[]): Record<string, unknown> {
  return Object.fromEntries(
    fields.filter((field) => field.default !== null && field.default !== undefined).map((field) => [field.name, field.default]),
  );
}

export function FormFields({
  fields,
  values,
  onChange,
  errors = {},
  origin = "studio",
  onPendingChange,
}: {
  fields: InputField[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  errors?: Record<string, FieldError>;
  /** Where uploaded files are used (shown with the file, kept for schedules and test cases). */
  origin?: UploadOrigin;
  /** Uploads still running per file field. */
  onPendingChange?: (field: string, count: number) => void;
}) {
  const { t } = useTranslation();
  // Uploads finish one after another; each change builds on the latest values.
  const latest = useRef(values);
  latest.current = values;
  const set = (name: string, value: unknown) => {
    latest.current = { ...latest.current, [name]: value };
    onChange(latest.current);
  };
  return (
    <div className="stack-sm form-fields">
      {fields.map((field) => {
        const id = `form-${field.name}`;
        const value = values[field.name];
        const problem = errors[field.name];
        const label = `${field.label || field.name}${field.required ? " *" : ""}`;
        const hint = problem ? (
          <span className="output-field__error" role="alert">
            {problemText(t, problem)}
          </span>
        ) : (
          field.description || undefined
        );
        const invalid = problem ? true : undefined;
        if (field.type === "boolean")
          return (
            <Field key={field.name} label={label} hint={hint} htmlFor={id}>
              <Select
                id={id}
                aria-invalid={invalid}
                value={value === true ? "true" : value === false ? "false" : ""}
                placeholder={t("flow.form.choose")}
                onChange={(next) => set(field.name, next === "" ? null : next === "true")}
                options={[
                  { value: "true", label: t("common.yes") },
                  { value: "false", label: t("common.no") },
                ]}
              />
            </Field>
          );
        if (field.type === "select")
          return (
            <Field key={field.name} label={label} hint={hint} htmlFor={id}>
              <Select
                id={id}
                aria-invalid={invalid}
                value={value === null || value === undefined ? "" : String(value)}
                placeholder={t("flow.form.choose")}
                onChange={(next) => set(field.name, next || null)}
                options={field.options.map((option) => ({ value: option, label: option }))}
              />
            </Field>
          );
        if (field.type === "file") {
          const ids = Array.isArray(value) ? (value as string[]) : [];
          return (
            <Field key={field.name} label={label} hint={hint} htmlFor={id} tip="inputs.field">
              <FileInput
                id={id}
                field={field}
                value={ids}
                origin={origin}
                invalid={invalid}
                onChange={(next) => set(field.name, next)}
                onPendingChange={onPendingChange ? (count) => onPendingChange(field.name, count) : undefined}
              />
            </Field>
          );
        }
        if (field.type === "textarea")
          return (
            <Field key={field.name} label={label} hint={hint} htmlFor={id}>
              <TextArea
                id={id}
                rows={4}
                aria-invalid={invalid}
                value={value === null || value === undefined ? "" : String(value)}
                onChange={(e) => set(field.name, e.target.value)}
              />
            </Field>
          );
        return (
          <Field key={field.name} label={label} hint={hint} htmlFor={id}>
            <TextInput
              id={id}
              aria-invalid={invalid}
              type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
              value={value === null || value === undefined ? "" : String(value)}
              onChange={(e) =>
                set(field.name, e.target.value === "" ? null : field.type === "number" ? Number(e.target.value) : e.target.value)
              }
            />
          </Field>
        );
      })}
    </div>
  );
}
