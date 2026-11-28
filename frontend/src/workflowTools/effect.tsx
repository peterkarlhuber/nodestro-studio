// What a workflow tool may do (N-20): its fixed version, the highest access and reach of everything it contains (at
// every depth: sub-workflows, teams and nested workflow tools included), persistent memory, approval steps, the
// workflows inside and what counted as unknown. Shown in the agent editor, its dialog and the approval card.

import { Badge } from "@nodestro/ui-core";
import { useTranslation } from "react-i18next";

import { useWorkflows } from "../api/hooks";
import type { WorkflowEffect, WorkflowSummary } from "../api/types";

const ACCESS_TONE = { read: "idle", write: "warning", destructive: "danger" } as const;

/** ``workflow_id@version`` of an effect's list, split (a version that is not a number stays null). */
export function splitRef(ref: string): { id: string; version: number | null } {
  const at = ref.lastIndexOf("@");
  if (at <= 0) return { id: ref, version: null };
  const version = Number(ref.slice(at + 1));
  return { id: ref.slice(0, at), version: Number.isInteger(version) ? version : null };
}

/** The name of a saved workflow, or its id when it is not in the list (deleted, or not loaded yet). */
export function workflowName(list: WorkflowSummary[] | undefined, id: string): string {
  return list?.find((item) => item.id === id)?.name || id;
}

/** The badges of an access and a reach (the texts of the tool approval card). */
export function CapabilityBadges({ access, reach }: { access: string; reach: string }) {
  const { t } = useTranslation();
  const tone = ACCESS_TONE[access as keyof typeof ACCESS_TONE] ?? "warning";
  return (
    <>
      <Badge tone={tone}>{t(`approvals.tool.access.${access}`, { defaultValue: access })}</Badge>
      <Badge tone={reach === "internal" ? "idle" : "warning"}>{t(`approvals.tool.reach.${reach}`, { defaultValue: reach })}</Badge>
    </>
  );
}

/** "Version 3 (fixed)", with "newer: 5" when a newer saved version exists (only reported, never used). */
export function FixedVersion({ version, latest }: { version: number; latest?: number | null }) {
  const { t } = useTranslation();
  return (
    <>
      <Badge tone="info">{t("workflowTools.fixedVersion", { version })}</Badge>
      {latest != null && latest > version ? (
        <Badge tone="warning">{t("workflowTools.newerVersion", { version: latest })}</Badge>
      ) : null}
    </>
  );
}

/**
 * The whole effect: access, reach, memory and approval steps as badges, the workflows it contains (the first is the
 * workflow itself) and the unknown parts. ``current`` is what the call is asked with now: when it is higher than the
 * stored effect, the card says so.
 */
export function EffectDetails({
  effect,
  current,
  testId = "workflow-tool-effect",
}: {
  effect: WorkflowEffect | null | undefined;
  current?: { access: string; reach: string };
  testId?: string;
}) {
  const { t } = useTranslation();
  const workflows = useWorkflows();
  if (!effect) {
    return (
      <p className="muted small" data-testid={testId}>
        {t("workflowTools.effect.unknownEffect")}
      </p>
    );
  }
  const nested = effect.workflows.slice(1);
  const raised = current && (current.access !== effect.access || current.reach !== effect.reach);
  return (
    <div className="stack-sm" data-testid={testId}>
      <div className="row-gap" role="list" aria-label={t("workflowTools.effect.label")}>
        <span role="listitem">
          <CapabilityBadges access={current?.access ?? effect.access} reach={current?.reach ?? effect.reach} />
        </span>
        {effect.memory ? (
          <span role="listitem">
            <Badge tone="warning">{t("workflowTools.effect.memory")}</Badge>
          </span>
        ) : null}
        {effect.approvals ? (
          <span role="listitem">
            <Badge tone="info">{t("workflowTools.effect.approvals", { count: effect.approvals })}</Badge>
          </span>
        ) : null}
      </div>
      <p className="muted small">{t("workflowTools.effect.scope")}</p>
      {raised ? (
        <p className="small text-warning" data-testid="workflow-tool-effect-raised">
          {t("workflowTools.effect.raised")}
        </p>
      ) : null}
      {nested.length ? (
        <div>
          <span className="nd-field-label">{t("workflowTools.effect.contains", { count: nested.length })}</span>
          <ul className="small workflow-tool__list" data-testid="workflow-tool-nested">
            {nested.map((ref) => {
              const { id, version } = splitRef(ref);
              const name = workflowName(workflows.data, id);
              return (
                <li key={ref}>
                  {version != null ? t("workflowTools.effect.nestedItem", { name, version }) : name}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {effect.unknown.length ? (
        <p className="small text-warning" data-testid="workflow-tool-unknown">
          {t("workflowTools.effect.unknown", { items: effect.unknown.join(", ") })}
        </p>
      ) : null}
    </div>
  );
}

/** The arguments of a call as name and value, in the order the model sent them (the raw JSON is shown as well). */
export function ArgumentList({ values }: { values: Record<string, unknown> }) {
  const { t } = useTranslation();
  const entries = Object.entries(values);
  if (!entries.length) return <p className="muted small">{t("workflowTools.noArguments")}</p>;
  return (
    <dl className="workflow-tool__args" data-testid="workflow-tool-args">
      {entries.map(([name, value]) => (
        <div key={name}>
          <dt>
            <code>{name}</code>
          </dt>
          <dd>{typeof value === "string" ? value : JSON.stringify(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
