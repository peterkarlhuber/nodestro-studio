// Inspector of an orchestrator node: the pool of teams, the task, the model and the limits.

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { useWorkflows } from "../api/hooks";
import { MAX_DECISIONS, MAX_POOL, MAX_SELECT_CAPABILITIES, type OrchestratorConfig, type WorkflowNode } from "../api/types";
import { ModelPicker } from "../components/ModelPicker";
import { Callout, Chip, Field, IconButton, Select, TextArea, TextInput } from "../components/ui";
import { addCapabilities } from "../lib/capabilities";
import { childLink, parseTrail } from "../lib/trail";
import { Header, LabelField } from "./FlowInspectors";
import { useEditor } from "./store";

/** A whole number in ``low..high``; empty or invalid input gives null. */
export function wholeNumber(value: string, low: number, high: number): number | null {
  if (value.trim() === "") return null;
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(high, Math.max(low, number)) : null;
}

export function OrchestratorInspector({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const workflowId = useEditor((s) => s.workflowId);
  const { updateNode } = useEditor.getState();
  const workflows = useWorkflows();
  const [searchParams] = useSearchParams();
  const config = node.orchestrator as OrchestratorConfig;
  const set = (patch: Partial<OrchestratorConfig>, record = true) =>
    updateNode(node.id, { orchestrator: { ...config, ...patch } }, { record });
  const chosen = new Set(config.members.map((member) => member.workflow_id));
  const known = new Map((workflows.data ?? []).map((item) => [item.id, item]));
  const options = (workflows.data ?? [])
    .filter((item) => item.id !== workflowId && !chosen.has(item.id))
    .map((item) => ({ value: item.id, label: item.name }));
  const trail = workflowId ? parseTrail(searchParams.get("trail"), workflowId) : [];
  return (
    <div className="inspector__content">
      <Header node={node} title={t("editor.nodes.orchestrator")} tip="flow.orchestrator" text={t("flow.orchestrator.text")} />
      <LabelField node={node} />
      <Field
        label={t("flow.orchestrator.teams")}
        hint={t("flow.orchestrator.teamsHint", { max: MAX_POOL })}
        tip="flow.orchestratorTeams"
      >
        <div className="stack-sm" data-testid="orchestrator-teams">
          {config.members.length === 0 && !config.select?.capabilities.length ? (
            <p className="field__hint">{t("flow.orchestrator.noTeams")}</p>
          ) : null}
          {config.members.map((member) => {
            const team = known.get(member.workflow_id);
            return (
              <div key={member.workflow_id} className="mapping-row" data-testid="orchestrator-team">
                <div className="stack-sm">
                  {team && workflowId ? (
                    <Link to={childLink(trail, workflowId, member.workflow_id)}>{team.name}</Link>
                  ) : (
                    <span className="muted">{t("editor.subworkflow.missing")}</span>
                  )}
                  {team?.capabilities?.length ? (
                    <div className="chip-row">
                      {team.capabilities.map((tag) => (
                        <Chip key={tag}>{tag}</Chip>
                      ))}
                    </div>
                  ) : null}
                  {team ? (
                    <span className="field__hint">
                      {team.contract?.length
                        ? t("flow.orchestrator.delivers", { fields: team.contract.join(", ") })
                        : t("flow.subworkflow.noContract")}
                    </span>
                  ) : null}
                </div>
                <IconButton
                  icon={Trash2}
                  label={t("flow.orchestrator.removeTeam", { name: team?.name ?? member.workflow_id })}
                  onClick={() => set({ members: config.members.filter((item) => item.workflow_id !== member.workflow_id) })}
                />
              </div>
            );
          })}
          {config.members.length < MAX_POOL ? (
            <Select
              value=""
              placeholder={t("flow.orchestrator.addTeam")}
              onChange={(value) => value && set({ members: [...config.members, { workflow_id: value, version: null }] })}
              options={options}
            />
          ) : null}
        </div>
      </Field>
      <SelectField config={config} set={set} />
      <Field label={t("flow.orchestrator.task")} hint={t("flow.orchestrator.taskHint", { input: "{{input}}" })}>
        <TextArea rows={3} value={config.task_template} onChange={(e) => set({ task_template: e.target.value }, false)} />
      </Field>
      <Field label={t("flow.orchestrator.instructions")} hint={t("flow.orchestrator.instructionsHint")}>
        <TextArea
          rows={4}
          value={config.instructions}
          onChange={(e) => set({ instructions: e.target.value }, false)}
          data-testid="orchestrator-instructions"
        />
      </Field>
      <Field label={t("flow.orchestrator.model")}>
        <ModelPicker id={`orchestrator-model-${node.id}`} value={config.model} onChange={(model) => set({ model })} />
      </Field>
      <Field
        label={t("flow.orchestrator.maxDecisions")}
        hint={t("flow.orchestrator.maxDecisionsHint", { max: MAX_DECISIONS })}
        tip="flow.orchestratorLimits"
      >
        <TextInput
          type="number"
          min={1}
          max={MAX_DECISIONS}
          step={1}
          value={config.max_decisions}
          onChange={(e) => set({ max_decisions: wholeNumber(e.target.value, 1, MAX_DECISIONS) ?? 1 })}
          data-testid="orchestrator-decisions"
        />
      </Field>
      <Field label={t("flow.orchestrator.maxPerTeam")} hint={t("flow.orchestrator.maxPerTeamHint")} tip="flow.orchestratorLimits">
        <TextInput
          type="number"
          min={1}
          max={config.max_decisions}
          step={1}
          value={config.max_per_member ?? ""}
          onChange={(e) => set({ max_per_member: wholeNumber(e.target.value, 1, config.max_decisions) })}
          data-testid="orchestrator-per-team"
        />
      </Field>
      <Callout tone="info">{t("flow.orchestrator.safety")}</Callout>
    </div>
  );
}

/** Teams by capability (AO M5): matching saved workflows join the pool when a run starts. */
function SelectField({
  config,
  set,
}: {
  config: OrchestratorConfig;
  set: (patch: Partial<OrchestratorConfig>, record?: boolean) => void;
}) {
  const { t } = useTranslation();
  const workflows = useWorkflows();
  const [typed, setTyped] = useState("");
  const select = config.select ?? null;
  const tags = select?.capabilities ?? [];
  const maxTeams = select?.max_teams ?? 5;
  const update = (capabilities: string[], max_teams = maxTeams) =>
    set({ select: capabilities.length ? { capabilities, max_teams } : null });
  const take = () => {
    if (!typed.trim()) return;
    update(addCapabilities(tags, typed, MAX_SELECT_CAPABILITIES));
    setTyped("");
  };
  const wanted = new Set(tags.map((tag) => tag.toLowerCase()));
  const chosen = new Set(config.members.map((member) => member.workflow_id));
  const matching = (workflows.data ?? []).filter(
    (item) => !chosen.has(item.id) && (item.capabilities ?? []).some((tag) => wanted.has(tag.toLowerCase())),
  );
  return (
    <Field label={t("flow.orchestrator.select")} hint={t("flow.orchestrator.selectHint")} tip="flow.orchestratorSelect">
      <div className="stack-sm" data-testid="orchestrator-select">
        {tags.length ? (
          <div className="chip-row">
            {tags.map((tag) => (
              <Chip key={tag} onRemove={() => update(tags.filter((item) => item !== tag))}>
                {tag}
              </Chip>
            ))}
          </div>
        ) : null}
        <TextInput
          value={typed}
          placeholder={t("flow.orchestrator.selectPlaceholder")}
          disabled={tags.length >= MAX_SELECT_CAPABILITIES}
          onChange={(e) => setTyped(e.target.value)}
          onBlur={take}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              take();
            }
          }}
          data-testid="orchestrator-select-input"
        />
        {tags.length ? (
          <>
            <label className="mapping-row">
              <span>{t("flow.orchestrator.maxTeams")}</span>
              <TextInput
                type="number"
                min={1}
                max={MAX_POOL}
                step={1}
                value={maxTeams}
                onChange={(e) => update(tags, wholeNumber(e.target.value, 1, MAX_POOL) ?? 1)}
                data-testid="orchestrator-max-teams"
              />
            </label>
            <p className="field__hint" data-testid="orchestrator-select-preview">
              {matching.length
                ? t("flow.orchestrator.selectPreview", {
                    count: Math.min(matching.length, maxTeams),
                    teams: matching.map((item) => item.name).join(", "),
                  })
                : t("flow.orchestrator.selectNone")}
            </p>
          </>
        ) : null}
      </div>
    </Field>
  );
}
