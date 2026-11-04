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
export function Output({
  value,
  fields,
  steps,
}: {
  value: unknown;
  fields?: OutputField[] | null;
  /** For a result that collects several steps: each step's described fields by its name (see ``stepFieldsOf``). */
  steps?: Record<string, OutputField[]>;
}) {
  const { t } = useTranslation();
  if (value === null || value === undefined || value === "") return <p className="muted">{t("runs.noOutputYet")}</p>;
  if (typeof value === "string") return <Text value={value} />;
  if (typeof value !== "object") return <p>{scalarText(t, value)}</p>;
  return (
    <div className="structured-output" data-testid="structured-output">
      <StructuredValue value={value} fields={fields ?? undefined} steps={steps} depth={0} />
      <details className="technical">
        <summary>{t("runs.output.showJson")}</summary>
        <pre className="code-block" tabIndex={0}>{outputText(value)}</pre>
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
function humanize(name: string): string {
  const words = name.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : name;
}

/**
 * The label a field description gives: a short description is the label itself ("D1 Team mit Rollen"); a long one
 * gives its lead before the first colon ("Stillstandsanteil: Anteil der …" → "Stillstandsanteil"), else before the
 * first other break (" (", "; ", " – ", ", "), else its first words. The description stays the field's tooltip, and it
 * is in the workflow's language, unlike the field's technical name (ED-17, EX-002).
 */
export function descriptionLabel(description: string): string {
  const text = description.trim();
  if (text.length <= LABEL_MAX) return text;
  const lead = (end: number) => text.slice(0, end).trim();
  const colon = text.search(/:\s/);
  if (colon > 0 && lead(colon).length <= LABEL_MAX) return lead(colon);
  const other = text.search(/ \(|; | – | — |, /);
  if (other > 0 && lead(other).length >= 3 && lead(other).length <= LABEL_MAX) return lead(other);
  const cut = text.slice(0, LABEL_MAX);
  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, "")}…`;
}

/** The label of a structured result field: from its description when it has one, else its humanized name. */
export function fieldLabel(name: string, fields?: OutputField[]): string {
  const described = fields?.find((field) => field.name === name)?.description?.trim();
  return described ? descriptionLabel(described) : humanize(name);
}

function StructuredValue({
  value,
  fields,
  steps,
  depth,
}: {
  value: unknown;
  /** The described fields of this object (only where they are known). */
  fields?: OutputField[];
  /** The described fields of each entry of this object, by key (a result that collects several steps). */
  steps?: Record<string, OutputField[]>;
  depth: number;
}) {
  const { t } = useTranslation();
  if (value === null || value === undefined || value === "") return <span className="muted">–</span>;
  if (typeof value === "string") return <Text value={value} />;
  if (typeof value !== "object") return <span>{scalarText(t, value)}</span>;
  if (depth >= MAX_DEPTH) return <pre className="code-block" tabIndex={0}>{outputText(value)}</pre>;
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
          <dt title={fields?.find((field) => field.name === name)?.description || name}>{fieldLabel(name, fields)}</dt>
          <dd>
            <StructuredValue value={item} fields={steps?.[name]} depth={depth + 1} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

type FieldNode = { id: string; label?: string | null; agent?: { name?: string; output?: { fields?: OutputField[] } } | null };

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

/**
 * A result node with several inputs collects them by step name ({"Downtime analyst": {...}, ...}; the runtime's
 * ``node_label``: the node's label, else its agent's name). This maps each such key to the described fields of that
 * agent, so the fields inside show their labels instead of technical names. Undefined when nothing matches.
 */
export function stepFieldsOf(nodes: FieldNode[] | undefined, value: unknown): Record<string, OutputField[]> | undefined {
  if (!nodes || !value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const found: Record<string, OutputField[]> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const fields = nodes.find((node) => (node.label || node.agent?.name) === key)?.agent?.output?.fields;
    if (fields?.length) found[key] = fields;
  }
  return Object.keys(found).length ? found : undefined;
}
