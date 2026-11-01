// Inspector of an orchestrator node: the pool of teams, the task, the model and the limits.

import { ListChecks, Network, SlidersHorizontal, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { useWorkflows } from "../api/hooks";
import {
  MAX_DECISIONS,
  MAX_PARALLEL_TEAMS,
  MAX_POOL,
  MAX_SELECT_CAPABILITIES,
  LIVE_STEERING_DEFAULT,
  type LiveSteering,
  type OrchestratorConfig,
  type WorkflowCheck,
  type WorkflowNode,
} from "../api/types";
import { ModelPicker, useModelName } from "../components/ModelPicker";
import { Callout, Chip, Field, IconButton, Section, type SectionStatus, Select, TextArea, TextInput } from "../components/ui";
import { addCapabilities } from "../lib/capabilities";
import { childLink, parseTrail } from "../lib/trail";
import { findings } from "./CheckList";
import { Header, LabelField } from "./FlowInspectors";
import { useEditor } from "./store";

/** A whole number in ``low..high``; empty or invalid input gives null. */
export function wholeNumber(value: string, low: number, high: number): number | null {
  if (value.trim() === "") return null;
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(high, Math.max(low, number)) : null;
}

/** Problems of the check about the pool (missing, invalid or unmatched teams), for the Teams section's summary. */
export function poolStatus(check: WorkflowCheck | undefined, nodeId: string): SectionStatus {
  const status = { errors: 0, warnings: 0 };
  for (const finding of findings(check)) {
    if (finding.nodeId !== nodeId || !finding.item.code.startsWith("check.orchestrator_")) continue;
    if (finding.level === "error") status.errors += 1;
    else if (finding.level === "warning") status.warnings += 1;
  }
  return status;
}

export function OrchestratorInspector({ node, check }: { node: WorkflowNode; check?: WorkflowCheck }) {
  const { t } = useTranslation();
  const modelLabel = useModelName();
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
  const tags = config.select?.capabilities ?? [];
  const staffing = config.staffing ?? false;
  const parallel = config.max_parallel ?? 1;
  const poolSummary =
    [
      config.members.length
        ? t("flow.orchestrator.summary.members", {
            count: config.members.length,
          })
        : null,
      tags.length ? t("flow.orchestrator.summary.byCapability", { tags: tags.join(", ") }) : null,
    ]
      .filter(Boolean)
      .join(" · ") || t("flow.orchestrator.summary.noTeams");
  const limitSummary = [
    t("flow.orchestrator.summary.decisions", { count: config.max_decisions }),
    config.max_per_member ? t("flow.orchestrator.summary.perTeam", { count: config.max_per_member }) : null,
    t("flow.orchestrator.summary.parallel", { count: parallel }),
  ]
    .filter(Boolean)
    .join(" · ");
  const lineupSummary = staffing
    ? t("flow.orchestrator.summary.lineup", { count: config.max_team ?? 5 })
    : t("flow.orchestrator.summary.lineupOff");
  return (
    <div className="inspector__content">
      <Header node={node} title={t("editor.nodes.orchestrator")} tip="flow.orchestrator" text={t("flow.orchestrator.text")} />
      <p className="orchestrator-summary" data-testid="orchestrator-summary">
        {t("flow.orchestrator.summary.how", {
          pool: poolSummary,
          limits: limitSummary,
          lineup: lineupSummary,
        })}
      </p>
      <LabelField node={node} />
      <Section
        id="orchestrator-pool"
        title={t("flow.orchestrator.teams")}
        icon={Users}
        tip="flow.orchestratorTeams"
        summary={poolSummary}
        status={poolStatus(check, node.id)}
        defaultOpen={!config.members.length && !tags.length}
      >
        <Field label={t("flow.orchestrator.members")} hint={t("flow.orchestrator.teamsHint", { max: MAX_POOL })}>
          <div className="stack-sm" data-testid="orchestrator-teams">
            {config.members.length === 0 && !config.select?.capabilities.length ? (
              <p className="field__hint">{t("flow.orchestrator.noTeams")}</p>
            ) : null}
            {config.members.map((member) => {
              const team = known.get(member.workflow_id);
              return (
                <div key={member.workflow_id} className="pool-team" data-testid="orchestrator-team">
                  <div className="pool-team__body">
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
                    {/* Only a team that promises fields says so; the general note on contracts is in the help. */}
                    {team?.contract?.length ? (
                      <span className="field__hint">
                        {t("flow.orchestrator.delivers", {
                          fields: team.contract.join(", "),
                        })}
                      </span>
                    ) : null}
                  </div>
                  <IconButton
                    icon={Trash2}
                    label={t("flow.orchestrator.removeTeam", {
                      name: team?.name ?? member.workflow_id,
                    })}
                    onClick={() =>
                      set({
                        members: config.members.filter((item) => item.workflow_id !== member.workflow_id),
                      })
                    }
                  />
                </div>
              );
            })}
            {config.members.length < MAX_POOL ? (
              <Select
                value=""
                placeholder={t("flow.orchestrator.addTeam")}
                onChange={(value) =>
                  value &&
                  set({
                    members: [...config.members, { workflow_id: value, version: null }],
                  })
                }
                options={options}
              />
            ) : null}
          </div>
        </Field>
        <SelectField config={config} set={set} />
      </Section>
      <Section
        id="orchestrator-task"
        title={t("flow.orchestrator.assignment")}
        icon={ListChecks}
        summary={modelLabel(config.model)}
        defaultOpen={!config.task_template.trim()}
      >
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
      </Section>
      <Section
        id="orchestrator-limits"
        title={t("flow.orchestrator.limits")}
        icon={SlidersHorizontal}
        tip="flow.orchestratorLimits"
        summary={limitSummary}
      >
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
            onChange={(e) =>
              set({
                max_decisions: wholeNumber(e.target.value, 1, MAX_DECISIONS) ?? 1,
              })
            }
            data-testid="orchestrator-decisions"
          />
        </Field>
        <Field
          label={t("flow.orchestrator.maxPerTeam")}
          hint={t("flow.orchestrator.maxPerTeamHint")}
          tip="flow.orchestratorLimits"
        >
          <TextInput
            type="number"
            min={1}
            max={config.max_decisions}
            step={1}
            value={config.max_per_member ?? ""}
            onChange={(e) =>
              set({
                max_per_member: wholeNumber(e.target.value, 1, config.max_decisions),
              })
            }
            data-testid="orchestrator-per-team"
          />
        </Field>
        <label className="mapping-row">
          <span>{t("flow.orchestrator.maxParallel")}</span>
          <TextInput
            type="number"
            min={1}
            max={MAX_PARALLEL_TEAMS}
            step={1}
            value={parallel}
            onChange={(e) =>
              set({
                max_parallel: wholeNumber(e.target.value, 1, MAX_PARALLEL_TEAMS) ?? 1,
              })
            }
            data-testid="orchestrator-parallel"
          />
        </label>
        <Field label={t("runChat.editor.label")} hint={t("runChat.editor.hint")}>
          <Select
            value={config.live_steering ?? LIVE_STEERING_DEFAULT}
            onChange={(value) => set({ live_steering: value as LiveSteering })}
            options={(["attended", "always", "off"] as const).map((value) => ({ value, label: t(`runChat.editor.options.${value}`) }))}
            data-testid="orchestrator-live-steering"
          />
        </Field>
      </Section>
      <Section
        id="orchestrator-lineup"
        title={t("flow.orchestrator.lineup")}
        icon={Network}
        tip="flow.orchestratorDynamic"
        summary={lineupSummary}
        defaultOpen={staffing || Boolean(config.allow_values)}
      >
        <DynamicField config={config} set={set} />
      </Section>
      <Callout tone="info">{t("flow.orchestrator.safety")}</Callout>
    </div>
  );
}

/** Dynamic teams (AO M6b): parallel teams, a team the orchestrator assembles itself, team form values. */
function DynamicField({
  config,
  set,
}: {
  config: OrchestratorConfig;
  set: (patch: Partial<OrchestratorConfig>, record?: boolean) => void;
}) {
  const { t } = useTranslation();
  const staffing = config.staffing ?? false;
  return (
    <Field label={t("flow.orchestrator.dynamic")} hint={t("flow.orchestrator.dynamicHint")}>
      <div className="stack-sm" data-testid="orchestrator-dynamic">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={staffing}
            onChange={(e) =>
              set({
                staffing: e.target.checked,
                max_team: config.max_team ?? 5,
              })
            }
            data-testid="orchestrator-staffing"
          />
          {t("flow.orchestrator.staffing")}
        </label>
        {staffing ? (
          <label className="mapping-row">
            <span>{t("flow.orchestrator.maxTeam")}</span>
            <TextInput
              type="number"
              min={1}
              max={MAX_POOL}
              step={1}
              value={config.max_team ?? 5}
              onChange={(e) => set({ max_team: wholeNumber(e.target.value, 1, MAX_POOL) ?? 1 })}
              data-testid="orchestrator-max-team"
            />
          </label>
        ) : null}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={config.allow_values ?? false}
            onChange={(e) => set({ allow_values: e.target.checked })}
            data-testid="orchestrator-values"
          />
          {t("flow.orchestrator.allowValues")}
        </label>
      </div>
    </Field>
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
