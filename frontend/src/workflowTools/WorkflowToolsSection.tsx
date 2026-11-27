// The agent's workflow tools (N-20): saved workflows in a fixed version the agent may call as tools. The list shows
// each binding with its tool name, workflow, fixed version and what it may do; the dialog adds one: it picks a
// workflow and a saved version, reads the version as a tool (``GET /workflows/{id}/versions/{n}/tool``: the binding
// with its effect, the arguments, the newest version) and shows all of it before anything is added.
//
// Off by default (``NODESTRO_WORKFLOW_TOOLS``): only while the server lists ``workflow_tools`` in its features can a
// workflow be added. Bindings that exist are always shown (with a note that the agent does not start while it is
// off), so they can be seen and removed.

import { Button, Dialog, Field, IconButton, Select, TextArea, TextInput } from "@nodestro/ui-core";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Workflow as WorkflowIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { useWorkflowToolsEnabled } from "../api/conversations";
import { keys, useWorkflows } from "../api/hooks";
import { MAX_WORKFLOW_TOOLS, WORKFLOW_TOOL_NAME, type AgentConfig, type WorkflowToolConfig, type WorkflowToolInfo } from "../api/types";
import { HelpTip } from "../components/Tooltip";
import { Callout, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatDate } from "../lib/format";
import { EffectDetails, FixedVersion, workflowName } from "./effect";

/** Tool names the runtime gives the agent itself; a workflow tool never takes one (``workflow_tool.name_taken``). */
const RESERVED = ["memory", "files"];

/** The names a new workflow tool may not take: the agent's other tools, its workflow tools and the reserved ones. */
export function takenNames(agent: Pick<AgentConfig, "tools" | "server_tools" | "workflow_tools">): Set<string> {
  return new Set([...agent.tools, ...agent.server_tools, ...(agent.workflow_tools ?? []).map((item) => item.name), ...RESERVED]);
}

/** Why a tool name cannot be used (``null``: it can). */
export function nameProblem(name: string, taken: Set<string>): "invalid" | "taken" | null {
  if (!WORKFLOW_TOOL_NAME.test(name)) return "invalid";
  return taken.has(name) ? "taken" : null;
}

/** The binding to store: the one the API computed (with its effect), with the chosen name and description. */
export function bindingFrom(info: WorkflowToolInfo, name: string, description: string): WorkflowToolConfig {
  const binding: WorkflowToolConfig = { ...info.binding, name };
  const text = description.trim();
  if (text) binding.description = text;
  else delete binding.description;
  return binding;
}

/** The arguments a model fills, from the version's start form (as JSON Schema). */
function ArgumentsTable({ info }: { info: WorkflowToolInfo }) {
  const { t } = useTranslation();
  const properties = Object.entries(info.input_schema.properties ?? {});
  const required = new Set(info.input_schema.required ?? []);
  if (!properties.length) return <p className="muted small">{t("workflowTools.noArguments")}</p>;
  return (
    <table className="workflow-tool__table" data-testid="workflow-tool-dialog-args">
      <caption className="sr-only">{t("workflowTools.dialog.arguments")}</caption>
      <thead>
        <tr>
          <th scope="col">{t("workflowTools.dialog.argName")}</th>
          <th scope="col">{t("workflowTools.dialog.argType")}</th>
          <th scope="col">{t("workflowTools.dialog.argDescription")}</th>
        </tr>
      </thead>
      <tbody>
        {properties.map(([name, field]) => (
          <tr key={name}>
            <td>
              <code>{name}</code>
              {required.has(name) ? <span className="muted small"> · {t("workflowTools.dialog.required")}</span> : null}
            </td>
            <td>{field.enum ? field.enum.map(String).join(" | ") : (field.format ?? field.type ?? "")}</td>
            <td>{field.description || field.title || ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AddWorkflowToolDialog({
  open,
  onClose,
  agent,
  currentWorkflowId,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  agent: AgentConfig;
  /** The workflow being edited: it cannot call itself. */
  currentWorkflowId?: string | null;
  onAdd: (binding: WorkflowToolConfig) => void;
}) {
  const { t } = useTranslation();
  const workflows = useWorkflows();
  const [workflowId, setWorkflowId] = useState("");
  const [chosenVersion, setChosenVersion] = useState<number | null>(null);
  const [typedName, setTypedName] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const versions = useQuery({
    queryKey: keys.versions(workflowId),
    queryFn: () => api.versions(workflowId),
    enabled: open && Boolean(workflowId),
  });
  const newest = useMemo(() => Math.max(0, ...(versions.data ?? []).map((item) => item.number)) || null, [versions.data]);
  const version = chosenVersion ?? newest;
  const info = useQuery({
    queryKey: ["workflow-tool", workflowId, version],
    queryFn: () => api.workflowVersionTool(workflowId, version!),
    enabled: open && Boolean(workflowId) && version != null,
    retry: false,
  });
  const name = typedName ?? info.data?.binding.name ?? "";
  const problem = info.data ? nameProblem(name, takenNames(agent)) : null;
  const blocked = info.data?.blocked_fields ?? [];
  const canAdd = Boolean(info.data) && !problem && !blocked.length;
  const options = (workflows.data ?? [])
    .filter((item) => item.id !== currentWorkflowId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({ value: item.id, label: item.name || item.id }));
  const reset = () => {
    setWorkflowId("");
    setChosenVersion(null);
    setTypedName(null);
    setDescription("");
  };
  const close = () => {
    reset();
    onClose();
  };
  const add = () => {
    if (!info.data || !canAdd) return;
    onAdd(bindingFrom(info.data, name, description));
    close();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      size="lg"
      title={t("workflowTools.dialog.title")}
      description={t("workflowTools.dialog.description")}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" disabled={!canAdd} onClick={add} data-testid="workflow-tool-dialog-add">
            {t("workflowTools.dialog.add")}
          </Button>
        </>
      }
    >
      <div className="stack" data-testid="workflow-tool-dialog">
        <Field label={t("workflowTools.dialog.workflow")}>
          <Select
            value={workflowId}
            options={[{ value: "", label: t("workflowTools.dialog.chooseWorkflow") }, ...options]}
            onChange={(value) => {
              setWorkflowId(value);
              setChosenVersion(null);
              setTypedName(null);
            }}
            data-testid="workflow-tool-dialog-workflow"
          />
        </Field>
        {workflowId && versions.isPending ? <Spinner /> : null}
        {workflowId && versions.data && !versions.data.length ? (
          <Callout tone="warning">{t("workflowTools.dialog.noVersions")}</Callout>
        ) : null}
        {versions.data?.length ? (
          <Field label={t("workflowTools.dialog.version")} hint={t("workflowTools.dialog.versionHint")}>
            <Select
              value={version != null ? String(version) : ""}
              options={[...versions.data]
                .sort((a, b) => b.number - a.number)
                .map((item) => ({
                  value: String(item.number),
                  label: [
                    t("workflowTools.dialog.versionOption", { version: item.number, date: formatDate(item.created_at) }),
                    // The automatic label ("v3") repeats the number; a label someone wrote is shown.
                    /^v\d+$/.test(item.label) ? item.description : item.label || item.description,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                }))}
              onChange={(value) => setChosenVersion(Number(value))}
              data-testid="workflow-tool-dialog-version"
            />
          </Field>
        ) : null}
        {info.isFetching && !info.data ? <Spinner /> : null}
        {info.error ? (
          <Callout tone="danger">
            <ErrorText error={info.error} />
          </Callout>
        ) : null}
        {info.data ? (
          <>
            <section className="stack-sm" aria-label={t("workflowTools.dialog.preview")} data-testid="workflow-tool-dialog-preview">
              <div className="row-gap">
                <WorkflowIcon size={14} aria-hidden />
                <strong>{info.data.workflow_name}</strong>
                <FixedVersion version={info.data.binding.version} latest={info.data.latest_version} />
              </div>
              <span className="nd-field-label">{t("workflowTools.effect.title")}</span>
              <EffectDetails effect={info.data.binding.effect} testId="workflow-tool-dialog-effect" />
              <span className="nd-field-label">{t("workflowTools.dialog.arguments")}</span>
              <ArgumentsTable info={info.data} />
              {blocked.length ? (
                <Callout tone="danger">
                  <span data-testid="workflow-tool-dialog-blocked">{t("workflowTools.dialog.blocked", { fields: blocked.join(", ") })}</span>
                </Callout>
              ) : null}
              {info.data.binding.effect && info.data.binding.effect.access !== "read" ? (
                <p className="small muted">{t("workflowTools.dialog.asked")}</p>
              ) : null}
            </section>
            <Field
              label={t("workflowTools.dialog.name")}
              hint={t("workflowTools.dialog.nameHint")}
              error={problem === "invalid" ? t("workflowTools.dialog.name_invalid") : problem === "taken" ? t("workflowTools.dialog.name_taken") : undefined}
            >
              <TextInput value={name} maxLength={64} onChange={(event) => setTypedName(event.target.value)} data-testid="workflow-tool-dialog-name" />
            </Field>
            <Field label={t("workflowTools.dialog.toolDescription")} hint={t("workflowTools.dialog.toolDescriptionHint")}>
              <TextArea rows={2} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}

/** The workflow tools in the agent's Tools section. */
export function WorkflowToolsSection({
  agent,
  update,
  currentWorkflowId,
}: {
  agent: AgentConfig;
  update: (patch: Partial<AgentConfig>) => void;
  currentWorkflowId?: string | null;
}) {
  const { t } = useTranslation();
  const enabled = useWorkflowToolsEnabled();
  const workflows = useWorkflows();
  const [open, setOpen] = useState(false);
  const bindings = agent.workflow_tools ?? [];
  // Off and nothing bound: the section shows nothing new.
  if (!enabled && !bindings.length) return null;
  const remove = (name: string) => {
    const rest = bindings.filter((item) => item.name !== name);
    update({ workflow_tools: rest.length ? rest : undefined });
  };
  const full = bindings.length >= MAX_WORKFLOW_TOOLS;
  return (
    <div className="stack-sm" data-testid="workflow-tools">
      <span className="field__label">
        <span className="nd-field-label">{t("workflowTools.section.title")}</span>
        <HelpTip id="agent.workflowTools" label={t("workflowTools.section.help")} />
      </span>
      {!enabled ? (
        <Callout tone="warning">
          <span data-testid="workflow-tools-off">{t("workflowTools.section.off")}</span>
        </Callout>
      ) : null}
      {bindings.length ? (
        <ul className="workflow-tool__bindings" aria-label={t("workflowTools.section.title")}>
          {bindings.map((binding) => (
            <li key={binding.name} className="workflow-tool" data-testid="workflow-tool-binding">
              <div className="row-gap workflow-tool__head">
                <WorkflowIcon size={13} aria-hidden />
                <code>{binding.name}</code>
                <span>{workflowName(workflows.data, binding.workflow_id)}</span>
                <FixedVersion version={binding.version} />
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 size={13} aria-hidden />}
                  label={t("workflowTools.section.remove", { name: binding.name })}
                  onClick={() => remove(binding.name)}
                />
              </div>
              {binding.description ? <p className="small muted">{binding.description}</p> : null}
              <EffectDetails effect={binding.effect} />
            </li>
          ))}
        </ul>
      ) : null}
      {enabled ? (
        <div>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={13} aria-hidden />}
            disabled={full}
            onClick={() => setOpen(true)}
            data-testid="workflow-tools-add"
          >
            {t("workflowTools.section.add")}
          </Button>
          {full ? <p className="small muted">{t("workflowTools.section.full", { max: MAX_WORKFLOW_TOOLS })}</p> : null}
          {bindings.length ? null : <p className="field__hint">{t("workflowTools.section.hint")}</p>}
        </div>
      ) : null}
      {enabled ? (
        <AddWorkflowToolDialog
          open={open}
          onClose={() => setOpen(false)}
          agent={agent}
          currentWorkflowId={currentWorkflowId}
          onAdd={(binding) => update({ workflow_tools: [...bindings, binding] })}
        />
      ) : null}
    </div>
  );
}
