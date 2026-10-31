// Inspectors of the nodes that steer a workflow: decisions, approvals and sub-workflows,
// plus the input form of the start node and the result files of a result node.

import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { keys, useInputFormats, useWorkflows } from "../api/hooks";
import type {
  ApprovalConfig,
  ConditionConfig,
  ConditionOperator,
  ConditionRule,
  InputField,
  InputFieldType,
  OutputField,
  ReportFormat,
  ResultFileSpec,
  SubworkflowConfig,
  WorkflowNode,
} from "../api/types";
import {
  Button,
  Callout,
  Chip,
  Field,
  HelpTip,
  IconButton,
  Section,
  Segmented,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "../components/ui";
import { newField, newRule } from "../lib/defaults";
import { DEFAULT_FIELD_MB, FORMAT_GROUPS, fileFieldSummary } from "../lib/files";
import { childLink, parseTrail } from "../lib/trail";
import { branchLabel } from "./nodes";
import { OutputFieldsEditor } from "./OutputFieldsEditor";
import { useEditor } from "./store";

export const OPERATORS: ConditionOperator[] = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "gt",
  "gte",
  "lt",
  "lte",
  "is_true",
  "is_false",
  "in",
  "not_in",
  "is_empty",
  "is_not_empty",
];

/** Operators that compare with nothing (the value field is hidden). */
const UNARY = new Set<ConditionOperator>(["is_true", "is_false", "is_empty", "is_not_empty"]);
const LISTS = new Set<ConditionOperator>(["in", "not_in"]);
const TEXTUAL = new Set<ConditionOperator>([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "in",
  "not_in",
]);

const FIELD_TYPES: InputFieldType[] = ["text", "textarea", "number", "date", "boolean", "select", "file"];
const FORMATS: ReportFormat[] = ["md", "json", "csv", "html", "pdf", "docx", "xlsx"];

function move<T>(items: T[], index: number, by: number): T[] {
  const target = index + by;
  if (target < 0 || target >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

/** The value of a rule as typed text (a list as comma-separated categories). */
export function ruleValueText(rule: Pick<ConditionRule, "operator" | "value">): string {
  if (Array.isArray(rule.value)) return rule.value.join(", ");
  return rule.value === null || rule.value === undefined ? "" : String(rule.value);
}

/** Typed text as a rule value: categories for in/not_in, a number for comparisons when it is one. */
export function parseRuleValue(operator: ConditionOperator, text: string): unknown {
  if (LISTS.has(operator))
    return text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  if (["gt", "gte", "lt", "lte"].includes(operator) && text.trim() !== "" && !Number.isNaN(Number(text)))
    return Number(text);
  return text;
}

/** One condition rule's fields; also used by the checks of a test case. */
export function RuleEditor({
  rule,
  index,
  onChange,
  onRemove,
  onMove,
  fieldOptions,
  showLabel = true,
}: {
  rule: ConditionRule;
  index: number;
  onChange: (patch: Partial<ConditionRule>) => void;
  onRemove: () => void;
  onMove?: (by: number) => void;
  fieldOptions: string[];
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  const listId = `rule-fields-${rule.id}`;
  return (
    <div className="flow-item" role="group" aria-label={t("flow.rule.group", { n: index + 1 })}>
      <div className="flow-item__head">
        <strong>{rule.label || t("editor.condition.branchN", { n: index + 1 })}</strong>
        <span className="row-gap">
          {onMove ? (
            <>
              <IconButton icon={ArrowUp} label={t("flow.moveUp")} onClick={() => onMove(-1)} />
              <IconButton icon={ArrowDown} label={t("flow.moveDown")} onClick={() => onMove(1)} />
            </>
          ) : null}
          <IconButton icon={Trash2} label={t("flow.rule.remove")} onClick={onRemove} />
        </span>
      </div>
      {showLabel ? (
        <Field label={t("flow.rule.label")}>
          <TextInput value={rule.label} onChange={(e) => onChange({ label: e.target.value })} />
        </Field>
      ) : null}
      <div className="grid-2">
        <Field label={t("flow.rule.field")} hint={t("flow.rule.fieldHint")}>
          <TextInput
            value={rule.field}
            list={listId}
            spellCheck={false}
            placeholder={t("flow.rule.wholeResult")}
            onChange={(e) => onChange({ field: e.target.value.trim() })}
          />
          <datalist id={listId}>
            {fieldOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
        <Field label={t("flow.rule.operator")}>
          <Select
            value={rule.operator}
            onChange={(value) => {
              const operator = value as ConditionOperator;
              onChange({ operator, value: parseRuleValue(operator, ruleValueText(rule)) });
            }}
            options={OPERATORS.map((value) => ({ value, label: t(`flow.operators.${value}`) }))}
          />
        </Field>
      </div>
      {UNARY.has(rule.operator) ? null : (
        <Field label={t("flow.rule.value")} hint={LISTS.has(rule.operator) ? t("flow.rule.listHint") : undefined}>
          <TextInput
            value={ruleValueText(rule)}
            onChange={(e) => onChange({ value: parseRuleValue(rule.operator, e.target.value) })}
          />
        </Field>
      )}
      {TEXTUAL.has(rule.operator) ? (
        <Toggle
          checked={rule.case_sensitive}
          onChange={(value) => onChange({ case_sensitive: value })}
          label={t("flow.rule.caseSensitive")}
        />
      ) : null}
    </div>
  );
}

/** The structured output fields of a node (for suggestions in rule fields). */
export function outputFieldsOf(node: WorkflowNode | undefined): string[] {
  if (node?.agent?.output.mode === "structured") return node.agent.output.fields.map((field) => field.name);
  if (node?.type === "start") return (node.start?.fields ?? []).map((field) => field.name);
  return [];
}

function Header({ node, title, tip, text }: { node: WorkflowNode; title: string; tip: Parameters<typeof HelpTip>[0]["id"]; text: string }) {
  const { t } = useTranslation();
  const { removeNodes } = useEditor.getState();
  return (
    <div className="row-between">
      <div>
        <h2 className="inspector__heading">
          {title} <HelpTip id={tip} label={title} />
        </h2>
        <p className="muted small">{text}</p>
      </div>
      <IconButton icon={Trash2} label={t("editor.inspector.deleteNode")} onClick={() => removeNodes([node.id])} />
    </div>
  );
}

function LabelField({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const { updateNode } = useEditor.getState();
  return (
    <Field label={t("editor.inspector.label")} hint={t("flow.labelHint")}>
      <TextInput value={node.label} onChange={(e) => updateNode(node.id, { label: e.target.value }, { record: false })} />
    </Field>
  );
}

export function ConditionInspector({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const nodes = useEditor((s) => s.nodes);
  const edges = useEditor((s) => s.edges);
  const { updateNode } = useEditor.getState();
  const config = node.condition as ConditionConfig;
  const set = (patch: Partial<ConditionConfig>, record = true) =>
    updateNode(node.id, { condition: { ...config, ...patch } }, { record });
  const setRule = (index: number, patch: Partial<ConditionRule>) =>
    set({ rules: config.rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)) }, false);
  const incoming = edges.filter((edge) => edge.target === node.id).map((edge) => edge.source);
  const candidates = nodes.filter((item) => item.id !== node.id && item.type !== "output");
  const sourceNode = nodes.find((item) => item.id === (config.source ?? incoming[0]));
  const unconnected = [...config.rules.map((rule) => rule.id), "default"].filter(
    (handle) => handle !== "default" && !edges.some((edge) => edge.source === node.id && edge.source_handle === handle),
  );
  return (
    <div className="inspector__content">
      <Header node={node} title={t("editor.nodes.condition")} tip="flow.condition" text={t("flow.condition.text")} />
      <LabelField node={node} />
      <Field label={t("flow.condition.source")} hint={t("flow.condition.sourceHint")} tip="flow.conditionSource">
        <Select
          value={config.source ?? ""}
          placeholder={t("flow.condition.incoming")}
          onChange={(value) => set({ source: value || null })}
          options={candidates.map((item) => ({ value: item.id, label: item.label }))}
        />
      </Field>
      <Field label={t("flow.condition.mode")} tip="flow.conditionMode">
        <Segmented
          label={t("flow.condition.mode")}
          value={config.mode}
          onChange={(mode) => set({ mode })}
          options={[
            { value: "first", label: t("flow.condition.modeFirst") },
            { value: "all", label: t("flow.condition.modeAll") },
          ]}
        />
      </Field>
      <div className="field__head">
        <span className="field__label nd-field-label">
          {t("flow.condition.rules")} <HelpTip id="flow.conditionRules" label={t("flow.condition.rules")} />
        </span>
      </div>
      <div className="stack-sm">
        {config.rules.map((rule, index) => (
          <RuleEditor
            key={rule.id}
            rule={rule}
            index={index}
            fieldOptions={outputFieldsOf(sourceNode)}
            onChange={(patch) => setRule(index, patch)}
            onRemove={() => set({ rules: config.rules.filter((_, i) => i !== index) })}
            onMove={(by) => set({ rules: move(config.rules, index, by) })}
          />
        ))}
        <Button
          icon={Plus}
          size="sm"
          onClick={() =>
            set({ rules: [...config.rules, newRule({ label: t("editor.condition.branchN", { n: config.rules.length + 1 }) })] })
          }
        >
          {t("flow.condition.addRule")}
        </Button>
      </div>
      <Field label={t("flow.condition.defaultLabel")} hint={t("flow.condition.defaultHint")}>
        <TextInput
          value={config.default_label}
          placeholder={t("editor.condition.otherwise")}
          onChange={(e) => set({ default_label: e.target.value }, false)}
        />
      </Field>
      <Field label={t("flow.condition.onInvalid")} tip="flow.conditionInvalid">
        <Select
          value={config.on_invalid}
          onChange={(value) => set({ on_invalid: value as ConditionConfig["on_invalid"] })}
          options={[
            { value: "default", label: t("flow.condition.invalidDefault") },
            { value: "fail", label: t("flow.condition.invalidFail") },
          ]}
        />
      </Field>
      {unconnected.length ? (
        <Callout tone="info">
          {t("flow.condition.unconnected", {
            names: unconnected.map((handle) => branchLabel(node, handle, t)).join(", "),
          })}
        </Callout>
      ) : null}
    </div>
  );
}

export function ApprovalInspector({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const nodes = useEditor((s) => s.nodes);
  const { updateNode } = useEditor.getState();
  const config = node.approval as ApprovalConfig;
  const set = (patch: Partial<ApprovalConfig>, record = true) =>
    updateNode(node.id, { approval: { ...config, ...patch } }, { record });
  const reviewable = nodes.filter((item) => item.type === "agent" || item.type === "subworkflow");
  return (
    <div className="inspector__content">
      <Header node={node} title={t("editor.nodes.approval")} tip="flow.approval" text={t("flow.approval.text")} />
      <LabelField node={node} />
      <Field label={t("flow.approval.instructions")} hint={t("flow.approval.instructionsHint")}>
        <TextArea rows={4} value={config.instructions} onChange={(e) => set({ instructions: e.target.value }, false)} />
      </Field>
      <Field label={t("flow.approval.show")} hint={t("flow.approval.showHint")} tip="flow.approvalShow">
        <div className="stack-sm">
          {reviewable.map((item) => (
            <label key={item.id} className="check-row">
              <input
                type="checkbox"
                checked={config.show.includes(item.id)}
                onChange={(e) =>
                  set({ show: e.target.checked ? [...config.show, item.id] : config.show.filter((id) => id !== item.id) })
                }
              />
              {item.label}
            </label>
          ))}
        </div>
      </Field>
      <Toggle
        checked={config.allow_comment}
        onChange={(value) => set({ allow_comment: value, require_comment_on_reject: value && config.require_comment_on_reject })}
        label={t("flow.approval.allowComment")}
        description={t("flow.approval.allowCommentHint")}
      />
      <Toggle
        checked={config.require_comment_on_reject}
        disabled={!config.allow_comment}
        onChange={(value) => set({ require_comment_on_reject: value })}
        label={t("flow.approval.requireComment")}
      />
      <Field label={t("flow.approval.onReject")} tip="flow.approvalReject">
        <Segmented
          label={t("flow.approval.onReject")}
          value={config.on_reject}
          onChange={(on_reject) => set({ on_reject })}
          options={[
            { value: "branch", label: t("flow.approval.rejectBranch") },
            { value: "stop", label: t("flow.approval.rejectStop") },
          ]}
        />
      </Field>
      <Callout tone="info">{t("flow.approval.never")}</Callout>
    </div>
  );
}

export function SubworkflowInspector({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const workflowId = useEditor((s) => s.workflowId);
  const { updateNode } = useEditor.getState();
  const workflows = useWorkflows();
  const [searchParams] = useSearchParams();
  const config = node.subworkflow as SubworkflowConfig;
  const set = (patch: Partial<SubworkflowConfig>, record = true) =>
    updateNode(node.id, { subworkflow: { ...config, ...patch } }, { record });
  const target = useQuery({
    queryKey: keys.workflow(config.workflow_id),
    queryFn: () => api.workflow(config.workflow_id),
    enabled: Boolean(config.workflow_id),
  });
  const versions = useQuery({
    queryKey: keys.versions(config.workflow_id),
    queryFn: () => api.versions(config.workflow_id),
    enabled: Boolean(config.workflow_id),
  });
  const fields = target.data?.nodes.find((item) => item.type === "start")?.start?.fields ?? [];
  const options = (workflows.data ?? [])
    .filter((item) => item.id !== workflowId)
    .map((item) => ({ value: item.id, label: item.name }));
  return (
    <div className="inspector__content">
      <Header node={node} title={t("editor.nodes.subworkflow")} tip="flow.subworkflow" text={t("flow.subworkflow.text")} />
      <LabelField node={node} />
      <Field label={t("flow.subworkflow.workflow")}>
        <Select
          value={config.workflow_id}
          placeholder={t("flow.subworkflow.pick")}
          onChange={(value) => set({ workflow_id: value, version: null, values: {} })}
          options={options}
        />
      </Field>
      {config.workflow_id && workflowId ? (
        <TeamSummary
          contract={target.data?.nodes.find((item) => item.type === "output")?.output?.contract ?? []}
          capabilities={target.data?.capabilities ?? []}
          link={childLink(parseTrail(searchParams.get("trail"), workflowId), workflowId, config.workflow_id)}
          loaded={Boolean(target.data)}
        />
      ) : null}
      {config.workflow_id ? (
        <Field label={t("flow.subworkflow.version")} hint={t("flow.subworkflow.versionHint")} tip="flow.subworkflowVersion">
          <Select
            value={config.version === null ? "" : String(config.version)}
            placeholder={t("editor.subworkflow.latest")}
            onChange={(value) => set({ version: value ? Number(value) : null })}
            options={(versions.data ?? []).map((version) => ({
              value: String(version.number),
              label: `${t("editor.subworkflow.versionN", { n: version.number })}${version.description ? ` – ${version.description}` : ""}`,
            }))}
          />
        </Field>
      ) : null}
      <Field label={t("flow.subworkflow.input")} hint={t("flow.subworkflow.inputHint", { input: "{{input}}" })}>
        <TextArea rows={3} value={config.input_template} onChange={(e) => set({ input_template: e.target.value }, false)} />
      </Field>
      {fields.length ? (
        <Field label={t("flow.subworkflow.values")} hint={t("flow.subworkflow.valuesHint", { formExample: "{{form.customer}}", agentExample: "{{Name}}" })} tip="flow.subworkflowValues">
          <div className="stack-sm">
            {fields.map((field) => (
              <label key={field.name} className="mapping-row">
                <span>
                  {field.label || field.name}
                  {field.required ? " *" : ""}
                </span>
                <TextInput
                  value={config.values[field.name] ?? ""}
                  placeholder={`{{form.${field.name}}}`}
                  onChange={(e) => set({ values: { ...config.values, [field.name]: e.target.value } }, false)}
                />
              </label>
            ))}
          </div>
        </Field>
      ) : null}
      <Callout tone="info">{t("flow.subworkflow.costs")}</Callout>
    </div>
  );
}

/** The input form of a workflow, edited at its start node. */
export function FormEditor({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const { updateNode } = useEditor.getState();
  const start = node.start ?? { default_input: "", file_ids: [], fields: [] };
  const fields = start.fields ?? [];
  const setFields = (next: InputField[], record = true) => updateNode(node.id, { start: { ...start, fields: next } }, { record });
  const setField = (index: number, patch: Partial<InputField>) =>
    setFields(
      fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
      false,
    );
  const names = fields.map((field) => field.name);
  return (
    <section className="stack-sm" aria-label={t("flow.form.title")}>
      <div className="field__head">
        <span className="field__label nd-field-label">
          {t("flow.form.title")} <HelpTip id="flow.form" label={t("flow.form.title")} />
        </span>
      </div>
      <p className="field__hint">{fields.length ? t("flow.form.hint", { example: "{{form.name}}" }) : t("flow.form.empty")}</p>
      {fields.map((field, index) => {
        const duplicate = field.name && names.indexOf(field.name) !== index;
        return (
          <div key={index} className="flow-item" role="group" aria-label={t("flow.form.field", { name: field.label || field.name || index + 1 })}>
            <div className="flow-item__head">
              <strong>{field.label || field.name || t("flow.form.newField")}</strong>
              <span className="row-gap">
                <IconButton icon={ArrowUp} label={t("flow.moveUp")} onClick={() => setFields(move(fields, index, -1))} />
                <IconButton icon={ArrowDown} label={t("flow.moveDown")} onClick={() => setFields(move(fields, index, 1))} />
                <IconButton icon={Trash2} label={t("flow.form.remove")} onClick={() => setFields(fields.filter((_, i) => i !== index))} />
              </span>
            </div>
            <div className="grid-2">
              <Field label={t("flow.form.label")}>
                <TextInput value={field.label} onChange={(e) => setField(index, { label: e.target.value })} />
              </Field>
              <Field
                label={t("flow.form.name")}
                hint={duplicate ? <span className="output-field__error">{t("flow.form.duplicate")}</span> : undefined}
                tip={index === 0 ? "flow.formField" : undefined}
              >
                <TextInput
                  value={field.name}
                  spellCheck={false}
                  placeholder="customer"
                  aria-invalid={duplicate ? true : undefined}
                  onChange={(e) => setField(index, { name: e.target.value.replace(/[^A-Za-z0-9_]/g, "_") })}
                />
              </Field>
            </div>
            <div className="grid-2">
              <Field label={t("flow.form.type")}>
                <Select
                  value={field.type}
                  onChange={(value) =>
                    setField(index, {
                      type: value as InputFieldType,
                      default: null,
                      ...(value === "file" ? { accept: [], multiple: true, delivery: "auto" as const } : {}),
                    })
                  }
                  options={FIELD_TYPES.map((value) => ({ value, label: t(`flow.form.types.${value}`) }))}
                />
              </Field>
              {field.type === "file" ? null : (
                <Field label={t("flow.form.default")}>
                  {field.type === "boolean" ? (
                    <Select
                      value={field.default === true ? "true" : field.default === false ? "false" : ""}
                      placeholder={t("flow.form.noDefault")}
                      onChange={(value) => setField(index, { default: value === "" ? null : value === "true" })}
                      options={[
                        { value: "true", label: t("common.yes") },
                        { value: "false", label: t("common.no") },
                      ]}
                    />
                  ) : (
                    <TextInput
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      value={field.default === null || field.default === undefined ? "" : String(field.default)}
                      onChange={(e) =>
                        setField(index, {
                          default:
                            e.target.value === "" ? null : field.type === "number" ? Number(e.target.value) : e.target.value,
                        })
                      }
                    />
                  )}
                </Field>
              )}
            </div>
            {field.type === "select" ? (
              <Field label={t("flow.form.options")} hint={t("flow.rule.listHint")}>
                <TextInput
                  value={field.options.join(", ")}
                  onChange={(e) =>
                    setField(index, {
                      options: e.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>
            ) : null}
            <Field label={t("flow.form.description")}>
              <TextInput value={field.description} onChange={(e) => setField(index, { description: e.target.value })} />
            </Field>
            {field.type === "file" ? <FileFieldSettings field={field} onChange={(patch) => setField(index, patch)} /> : null}
            <div className="row-gap">
              <Segmented
                label={t("flow.form.requiredLabel")}
                value={field.required ? "required" : "optional"}
                onChange={(value) => setField(index, { required: value === "required" })}
                options={[
                  { value: "required", label: t("flow.form.required") },
                  { value: "optional", label: t("flow.form.optional") },
                ]}
              />
              <HelpTip id="inputs.optional" label={t("flow.form.requiredLabel")} />
            </div>
            <p className="field__hint">{field.required ? t("flow.form.requiredHint") : t("flow.form.optionalHint")}</p>
          </div>
        );
      })}
      <Button
        icon={Plus}
        size="sm"
        onClick={() => setFields([...fields, newField({ name: `field_${fields.length + 1}`, label: t("flow.form.newField") })])}
      >
        {t("flow.form.add")}
      </Button>
    </section>
  );
}

/** What a file field accepts and how its files reach the agents. */
function FileFieldSettings({ field, onChange }: { field: InputField; onChange: (patch: Partial<InputField>) => void }) {
  const { t } = useTranslation();
  const formats = useInputFormats();
  const accept = field.accept ?? [];
  const multiple = field.multiple !== false;
  const toggle = (key: string) =>
    onChange({ accept: accept.includes(key) ? accept.filter((item) => item !== key) : [...accept, key] });
  const number = (value: string) => (value === "" ? null : Math.max(1, Math.round(Number(value))));
  return (
    <Section
      className="file-settings"
      title={t("inputs.config.options")}
      summary={fileFieldSummary(t, field, formats.data?.formats ?? [])}
    >
      <Field label={t("inputs.config.accept")} hint={accept.length ? undefined : t("inputs.config.acceptAll")} tip="inputs.formats">
        <div className="chip-row" role="group" aria-label={t("inputs.config.accept")}>
          {FORMAT_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              className={`chip chip--button ${accept.includes(group) ? "chip--on" : ""}`}
              aria-pressed={accept.includes(group)}
              onClick={() => toggle(group)}
            >
              {t(`inputs.groups.${group}`)}
            </button>
          ))}
        </div>
        <div className="chip-row" role="group" aria-label={t("inputs.config.formats")}>
          {(formats.data?.formats ?? [])
            .filter((format) => format.key !== "code")
            .map((format) => {
              const viaGroup = accept.includes(format.group);
              return (
                <button
                  key={format.key}
                  type="button"
                  className={`chip chip--button ${accept.includes(format.key) || viaGroup ? "chip--on" : ""}`}
                  aria-pressed={accept.includes(format.key) || viaGroup}
                  disabled={viaGroup}
                  onClick={() => toggle(format.key)}
                >
                  {format.extensions[0]}
                </button>
              );
            })}
        </div>
      </Field>
      <Toggle
        checked={multiple}
        onChange={(value) => onChange({ multiple: value, max_files: value ? field.max_files : null })}
        label={t("inputs.config.multiple")}
        description={t("inputs.config.multipleHint")}
        tip="inputs.config"
      />
      <div className="grid-2">
        {multiple ? (
          <Field label={t("inputs.config.maxFiles")}>
            <TextInput
              type="number"
              min={1}
              max={100}
              value={field.max_files ?? ""}
              placeholder={t("inputs.config.unlimited")}
              onChange={(e) => onChange({ max_files: number(e.target.value) })}
            />
          </Field>
        ) : null}
        <Field label={t("inputs.config.maxSize")}>
          <TextInput
            type="number"
            min={1}
            max={50}
            value={field.max_size_mb ?? ""}
            placeholder={String(DEFAULT_FIELD_MB)}
            onChange={(e) => onChange({ max_size_mb: number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label={t("inputs.config.delivery")} hint={t(`inputs.config.deliveryHint.${field.delivery ?? "auto"}`)} tip="inputs.delivery">
        <Select
          value={field.delivery ?? "auto"}
          onChange={(value) => onChange({ delivery: value as InputField["delivery"] })}
          options={(["auto", "inline", "on_demand"] as const).map((value) => ({ value, label: t(`inputs.config.deliveryModes.${value}`) }))}
        />
      </Field>
    </Section>
  );
}

/** The files a result node writes at the end of a run. */
export function OutputFilesEditor({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const { updateNode } = useEditor.getState();
  const files = node.output?.files ?? [];
  const setFiles = (next: ResultFileSpec[], record = true) => updateNode(node.id, { output: { ...node.output, files: next } }, { record });
  const setFile = (index: number, patch: Partial<ResultFileSpec>, record = true) =>
    setFiles(
      files.map((file, i) => (i === index ? { ...file, ...patch } : file)),
      record,
    );
  return (
    <section className="stack-sm" aria-label={t("flow.files.title")}>
      <div className="field__head">
        <span className="field__label nd-field-label">
          {t("flow.files.title")} <HelpTip id="files.output" label={t("flow.files.title")} />
        </span>
      </div>
      <p className="field__hint">{t("flow.files.hint")}</p>
      {files.map((file, index) => (
        <div key={index} className="flow-item" role="group" aria-label={t("flow.files.file", { n: index + 1 })}>
          <div className="grid-2">
            <Field label={t("flow.files.format")}>
              <Select
                value={file.format}
                onChange={(value) => setFile(index, { format: value as ReportFormat })}
                options={FORMATS.map((value) => ({ value, label: t(`flow.files.formats.${value}`) }))}
              />
            </Field>
            <Field label={t("flow.files.name")}>
              <TextInput
                value={file.name}
                placeholder={t("flow.files.namePlaceholder")}
                onChange={(e) => setFile(index, { name: e.target.value }, false)}
              />
            </Field>
          </div>
          <div className="row-between">
            <Toggle
              checked={file.sanitize}
              onChange={(value) => setFile(index, { sanitize: value })}
              label={t("flow.files.sanitize")}
              tip="files.sanitize"
            />
            <IconButton icon={Trash2} label={t("flow.files.remove")} onClick={() => setFiles(files.filter((_, i) => i !== index))} />
          </div>
        </div>
      ))}
      <Button icon={Plus} size="sm" onClick={() => setFiles([...files, { format: "md", name: "", sanitize: false }])}>
        {t("flow.files.add")}
      </Button>
    </section>
  );
}

/** The output contract of a result node: the fields the workflow promises to deliver as a team. */
export function OutputContractEditor({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const { updateNode } = useEditor.getState();
  const contract = node.output?.contract ?? [];
  const setContract = (next: OutputField[]) =>
    updateNode(node.id, { output: { files: node.output?.files ?? [], ...node.output, contract: next } });
  return (
    <section className="stack-sm" aria-label={t("flow.contract.title")} data-testid="output-contract">
      <div className="field__head">
        <span className="field__label nd-field-label">
          {t("flow.contract.title")} <HelpTip id="workflow.contract" label={t("flow.contract.title")} />
        </span>
      </div>
      <p className="field__hint">{contract.length ? t("flow.contract.hint") : t("flow.contract.none")}</p>
      {contract.length ? (
        <OutputFieldsEditor fields={contract} onChange={setContract} idPrefix="contract-field" />
      ) : (
        <Button
          icon={Plus}
          size="sm"
          onClick={() =>
            setContract([{ name: "summary", type: "string", description: t("agent.output.defaultFieldDescription"), required: true }])
          }
        >
          {t("flow.contract.add")}
        </Button>
      )}
    </section>
  );
}

/** What a team delivers (its output contract) and can do, with a link into it. */
function TeamSummary({
  contract,
  capabilities,
  link,
  loaded,
}: {
  contract: OutputField[];
  capabilities: string[];
  link: string;
  loaded: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="stack-sm" data-testid="team-summary">
      {loaded ? (
        <p className="field__hint">
          {contract.length
            ? t("flow.subworkflow.delivers", {
                fields: contract.map((field) => `${field.name} (${t(`agent.options.fieldType.${field.type}`)})`).join(", "),
              })
            : t("flow.subworkflow.noContract")}
        </p>
      ) : null}
      {capabilities.length ? (
        <div className="chip-row">
          {capabilities.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      ) : null}
      <Link to={link} className="small" data-testid="open-team">
        {t("flow.subworkflow.open")}
      </Link>
    </div>
  );
}
