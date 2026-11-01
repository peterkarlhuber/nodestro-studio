import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import type { Components } from "react-markdown";

import type { OutputField } from "../api/types";
import { outputText } from "../lib/format";

// The Markdown parser (about 165 kB) loads with the first formatted text shown, not with every page.
const MarkdownRenderer = lazy(() => import("./MarkdownRenderer"));

/**
 * Markdown text. Until the parser has loaded, the text is shown as it is (line breaks kept), so the
 * content is there at once and no spinner blinks.
 */
export function MarkdownText({ text, components }: { text: string; components?: Components }) {
  return (
    <Suspense fallback={<p className="markdown-pending">{text}</p>}>
      <MarkdownRenderer text={text} components={components} />
    </Suspense>
  );
}

/** How deep a structured result is shown as labelled fields; anything deeper is shown as JSON. */
const MAX_DEPTH = 3;
/** The longest field description that is used as the field's label. */
const LABEL_MAX = 60;

/** Agent output: Markdown for text, labelled fields for structured results (the JSON stays one click away). */
export function Output({ value, fields }: { value: unknown; fields?: OutputField[] | null }) {
  const { t } = useTranslation();
  if (value === null || value === undefined || value === "") return <p className="muted">{t("runs.noOutputYet")}</p>;
  if (typeof value === "string") return <Text value={value} />;
  if (typeof value !== "object") return <p>{scalarText(t, value)}</p>;
  return (
    <div className="structured-output" data-testid="structured-output">
      <StructuredValue value={value} fields={fields ?? undefined} depth={0} />
      <details className="technical">
        <summary>{t("runs.output.showJson")}</summary>
        <pre className="code-block">{outputText(value)}</pre>
      </details>
    </div>
  );
}

function Text({ value }: { value: string }) {
  return (
    <div className="markdown">
      <MarkdownText text={value} />
    </div>
  );
}

function scalarText(t: (key: string) => string, value: unknown): string {
  if (typeof value === "boolean") return t(value ? "common.yes" : "common.no");
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

/** "d2_problem" → "D2 problem": a readable name for a field that has no description. */
export function fieldLabel(name: string, fields?: OutputField[]): string {
  const described = fields?.find((field) => field.name === name)?.description?.trim();
  // A short description reads as a label ("D1 Team mit Rollen"); a long one stays the field's tooltip.
  if (described && described.length <= LABEL_MAX) return described;
  const words = name.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : name;
}

function StructuredValue({ value, fields, depth }: { value: unknown; fields?: OutputField[]; depth: number }) {
  const { t } = useTranslation();
  if (value === null || value === undefined || value === "") return <span className="muted">–</span>;
  if (typeof value === "string") return <Text value={value} />;
  if (typeof value !== "object") return <span>{scalarText(t, value)}</span>;
  if (depth >= MAX_DEPTH) return <pre className="code-block">{outputText(value)}</pre>;
  if (Array.isArray(value)) {
    if (!value.length) return <span className="muted">–</span>;
    return (
      <ul className="structured-output__list">
        {value.map((item, index) => (
          <li key={index}>
            <StructuredValue value={item} depth={depth + 1} />
          </li>
        ))}
      </ul>
    );
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return <span className="muted">–</span>;
  return (
    <dl className="structured-output__fields">
      {entries.map(([name, item]) => (
        <div key={name}>
          <dt title={(depth === 0 ? fields : undefined)?.find((field) => field.name === name)?.description || name}>
            {fieldLabel(name, depth === 0 ? fields : undefined)}
          </dt>
          <dd>
            <StructuredValue value={item} depth={depth + 1} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

type FieldNode = { id: string; agent?: { output?: { fields?: OutputField[] } } | null };

/**
 * The described fields of a structured result, looked up in the workflow the run used: those of the node itself,
 * else (for a value passed on, e.g. by the Result node) those of the agent whose fields name every key of it.
 */
export function outputFieldsOf(nodes: FieldNode[] | undefined, nodeId: string, value?: unknown): OutputField[] | undefined {
  const own = nodes?.find((node) => node.id === nodeId)?.agent?.output?.fields;
  if (own?.length || !value || typeof value !== "object" || Array.isArray(value)) return own;
  const keys = Object.keys(value as Record<string, unknown>);
  if (!keys.length) return own;
  return nodes
    ?.map((node) => node.agent?.output?.fields)
    .find((fields) => fields?.length && keys.every((key) => fields.some((field) => field.name === key)));
}
