// How an agent binds its built-in tools (NAL-A1, NAL-A2): the service connection of a tool whose spec needs one, an
// "Internet" badge for tools that reach outside, and the binding parameters of the spec's params_schema under
// "Advanced" (search_web: result count, region, language, time range, domains, calls; fetch_web_page: domains,
// characters, calls). Values go to tool_settings[tool].params and are only written when the schema accepts them;
// the runtime checks them again.

import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { type BuiltinTool, useBuiltinTools, useConnections } from "../api/connections";
import type { AgentConfig, ToolSettings } from "../api/types";
import { Badge, Field, Select, TextInput } from "../components/ui";

/** One property of a params_schema, as far as the form uses it. */
interface ParamSchema {
  type?: string;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: { maxLength?: number };
  maxItems?: number;
}

const propertiesOf = (tool: BuiltinTool) =>
  ((tool.spec?.params_schema as { properties?: Record<string, ParamSchema> } | undefined)?.properties ?? {}) as Record<
    string,
    ParamSchema
  >;

/** A host list as typed: separated by commas, spaces or line breaks. */
const hostList = (text: string) => text.split(/[\s,]+/).filter(Boolean);

/** The value to store for ``text`` (undefined: leave the parameter out), or null when the schema refuses it. */
export function paramValue(schema: ParamSchema, text: string): unknown {
  const value = text.trim();
  if (!value) return undefined;
  if (schema.type === "array") {
    const items = hostList(value);
    const longest = schema.items?.maxLength ?? Infinity;
    if (items.length > (schema.maxItems ?? Infinity) || items.some((item) => item.length > longest)) return null;
    return items;
  }
  if (schema.type === "integer" || schema.type === "number") {
    const number = Number(value);
    if (!Number.isFinite(number) || (schema.type === "integer" && !Number.isInteger(number))) return null;
    if ((schema.minimum !== undefined && number < schema.minimum) || (schema.maximum !== undefined && number > schema.maximum)) return null;
    return number;
  }
  if (Array.isArray(schema.enum)) return schema.enum.map(String).includes(value) ? value : null;
  if (schema.pattern && !new RegExp(schema.pattern).test(value)) return null;
  return value;
}

const shown = (value: unknown) => (Array.isArray(value) ? value.join(", ") : value === undefined || value === null ? "" : String(value));

/** Bindings of every assigned built-in tool that needs a connection, reaches the internet or has parameters. */
export function ToolBindings({ agent, update }: { agent: AgentConfig; update: (patch: Partial<AgentConfig>) => void }) {
  const { t } = useTranslation();
  const catalog = useBuiltinTools();
  const bound = (catalog.data ?? []).filter(
    (item) =>
      item.spec &&
      agent.tools.includes(item.name) &&
      (item.spec.connection_type || item.spec.network === "external" || Object.keys(propertiesOf(item)).length > 0),
  );
  const connections = useConnections(bound.some((item) => item.spec?.connection_type));
  if (!bound.length) return null;
  const write = (name: string, next: ToolSettings) => update({ tool_settings: { ...agent.tool_settings, [name]: next } });
  return (
    <div className="stack-sm" data-testid="tool-connections">
      {bound.map((item) => {
        const spec = item.spec!;
        const type = spec.connection_type;
        const settings: ToolSettings = agent.tool_settings?.[item.name] ?? { connection_id: null, params: {} };
        const options = (connections.data ?? []).filter((connection) => connection.type === type);
        const typeLabel = type ? t(`tools.connections.types.${type}`, { defaultValue: type }) : "";
        const properties = propertiesOf(item);
        return (
          <div key={item.name} className="stack-sm" data-testid={`tool-binding-${item.name}`}>
            <span className="small">
              <code>{item.name}</code>{" "}
              {spec.network === "external" ? <Badge tone="warning">{t("tools.spec.network.external")}</Badge> : null}
            </span>
            {type ? (
              <Field
                label={t("agent.tools.connection", { tool: item.name })}
                hint={
                  connections.data && !options.length ? (
                    <Trans
                      i18nKey="agent.tools.connectionNone"
                      values={{ type: typeLabel }}
                      components={{ a: <Link to="/tools?tab=connections" /> }}
                    />
                  ) : undefined
                }
              >
                <Select
                  value={settings.connection_id ?? ""}
                  placeholder={t("agent.tools.noConnection")}
                  options={options.map((connection) => ({ value: connection.id, label: connection.name }))}
                  onChange={(id) => write(item.name, { connection_id: id || null, params: settings.params ?? {} })}
                />
              </Field>
            ) : null}
            {Object.keys(properties).length ? (
              <details className="technical" data-testid={`tool-params-${item.name}`}>
                <summary>{t("agent.tools.params.advanced", { tool: item.name })}</summary>
                <div className="stack-sm">
                  {Object.entries(properties).map(([param, schema]) => (
                    <ParamField
                      key={param}
                      name={param}
                      schema={schema}
                      value={settings.params?.[param]}
                      onChange={(value) => {
                        const params = { ...(settings.params ?? {}) };
                        if (value === undefined) delete params[param];
                        else params[param] = value;
                        write(item.name, { connection_id: settings.connection_id ?? null, params });
                      }}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** One binding parameter. The text is kept while it is not valid; only a valid value (or none) is written. */
function ParamField({
  name,
  schema,
  value,
  onChange,
}: {
  name: string;
  schema: ParamSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState(() => shown(value));
  const invalid = paramValue(schema, text) === null;
  const label = t(`agent.tools.params.name.${name}`, { defaultValue: name });
  const hint = invalid
    ? t("agent.tools.params.invalid")
    : t(`agent.tools.params.hint.${name}`, { defaultValue: "", min: schema.minimum, max: schema.maximum });
  const set = (next: string) => {
    setText(next);
    const parsed = paramValue(schema, next);
    if (parsed !== null) onChange(parsed);
  };
  if (Array.isArray(schema.enum))
    return (
      <Field label={label} hint={hint || undefined}>
        <Select
          value={text}
          placeholder={t("agent.tools.params.default")}
          options={schema.enum.map((option) => ({
            value: String(option),
            label: t(`agent.tools.params.option.${String(option)}`, { defaultValue: String(option) }),
          }))}
          onChange={set}
        />
      </Field>
    );
  const numeric = schema.type === "integer" || schema.type === "number";
  return (
    <Field label={label} hint={hint || undefined}>
      <TextInput
        type={numeric ? "number" : "text"}
        min={schema.minimum}
        max={schema.maximum}
        step={schema.type === "integer" ? 1 : undefined}
        maxLength={schema.pattern === "^[A-Za-z]{2}$" ? 2 : undefined}
        placeholder={t("agent.tools.params.default")}
        aria-invalid={invalid || undefined}
        value={text}
        onChange={(event) => set(event.target.value)}
      />
    </Field>
  );
}
