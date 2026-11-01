// What a finished run did not get done, from the stored run only (AD-03, AD-10):
// - tool calls that did not succeed (rejected, no decision in time, the service unreachable, the tool's own error):
//   the run's status stays "Done" (the backend counts steps only), so the interface says "Finished with problems";
// - steps that were still running or waiting when the run ended (Nodestro stopped): shown as "Not finished".
// Small, separate pieces so the run banner, the run detail and the editor's run panel can each include them.

import type { TFunction } from "i18next";
import { AlertTriangle, History } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { NodeRun, Run, RunSummary, ToolCallRecord } from "../api/types";
import { Badge, Button, Callout, StatusBadge } from "../components/ui";
import { problemText } from "../lib/errors";
import { codedToolOutput } from "../lib/toolOutput";
import { stepsInOrder } from "./runSummary";

/** What the backend says went wrong with tool calls (``Run.warnings`` / ``RunSummary.warnings``; newer backends). */
export interface RunWarning {
  code: string;
  node_id?: string | null;
  tool?: string | null;
  count?: number;
}

type WithWarnings = { warnings?: RunWarning[] | null };

function warningsOf(run: WithWarnings): RunWarning[] {
  return Array.isArray(run.warnings) ? run.warnings : [];
}

export type ToolProblemKind = "rejected" | "expired" | "denied" | "cancelled" | "coded" | "error";

export interface ToolProblem {
  nodeId: string;
  label: string;
  tool: string;
  kind: ToolProblemKind;
  call: ToolCallRecord;
}

const FINISHED = new Set<Run["status"]>(["succeeded", "failed", "cancelled"]);
/** Node states that mean "not done yet": in a finished run they never got to an end. */
const UNFINISHED = new Set<NodeRun["status"]>(["waiting", "running", "awaiting_approval"]);

function kindOf(call: ToolCallRecord): ToolProblemKind | null {
  const status = call.approval?.status;
  if (status === "rejected" || status === "expired" || status === "denied" || status === "cancelled") return status;
  if (!call.is_error) return null;
  return codedToolOutput(call.output) ? "coded" : "error";
}

/** Every tool call of the run's own steps that did not succeed, in the order the steps started (loop rounds too). */
export function toolProblems(run: Run): ToolProblem[] {
  const problems: ToolProblem[] = [];
  for (const node of stepsInOrder(run)) {
    const state = run.nodes[node.id];
    if (!state) continue;
    const label = node.label || node.agent?.name || node.id;
    for (const round of [...(state.earlier ?? []), state])
      for (const call of round.tool_calls ?? []) {
        const kind = kindOf(call);
        if (kind) problems.push({ nodeId: node.id, label, tool: call.name, kind, call });
      }
  }
  return problems;
}

/** A finished run whose steps all succeeded although tool calls did not: not a clean success. */
export function finishedWithProblems(run: Run & WithWarnings): boolean {
  return run.status === "succeeded" && (warningsOf(run).length > 0 || toolProblems(run).length > 0);
}

/** Steps that were still running or waiting when the run ended. */
export function unfinishedSteps(run: Run): { nodeId: string; label: string }[] {
  if (!FINISHED.has(run.status)) return [];
  return stepsInOrder(run)
    .filter((node) => {
      const state = run.nodes[node.id];
      return state ? UNFINISHED.has(state.status) : false;
    })
    .map((node) => ({ nodeId: node.id, label: node.label || node.agent?.name || node.id }));
}

/** The sentence for one problem, in the interface language. */
export function toolProblemText(t: TFunction, problem: ToolProblem): string {
  if (problem.kind === "coded") return problemText(t, codedToolOutput(problem.call.output)!);
  if (problem.kind === "denied" && problem.call.approval?.code) return problemText(t, { code: problem.call.approval.code });
  return t(`admin.run.toolProblem.${problem.kind}`);
}

/** The amber chip next to the run status: "Finished with problems" (text and icon, not colour alone). */
export function ProblemsChip({ run }: { run: Run }) {
  const { t } = useTranslation();
  if (!finishedWithProblems(run)) return null;
  return (
    <span data-testid="run-with-problems">
      <Badge tone="warning" icon={AlertTriangle}>
        {t("admin.run.withProblems")}
      </Badge>
    </span>
  );
}

/**
 * The chip in the executions list, from the summary's ``warnings`` (newer backends). An older backend sends nothing
 * about tool calls in the list, so there the chip appears on the run's own pages only.
 */
export function ListProblemsChip({ run }: { run: RunSummary & WithWarnings & { tool_errors?: number } }) {
  const { t } = useTranslation();
  if (run.status !== "succeeded" || !(warningsOf(run).length || run.tool_errors)) return null;
  return (
    <>
      {" "}
      <span data-testid="run-with-problems">
        <Badge tone="warning" icon={AlertTriangle}>
          {t("admin.run.withProblems")}
        </Badge>
      </span>
    </>
  );
}

/** The run's status badge with the chip beside it. */
export function RunOutcome({ run, label }: { run: Run; label?: string }) {
  return (
    <span className="run-outcome">
      <StatusBadge status={run.status} label={label} />
      <ProblemsChip run={run} />
    </span>
  );
}

/** A step's status badge; a step that never ended in a finished run reads "Not finished" instead of "Waiting". */
export function StepStatus({ run, state }: { run: Run; state: NodeRun }) {
  const { t } = useTranslation();
  const stuck = FINISHED.has(run.status) && UNFINISHED.has(state.status);
  return <StatusBadge status={state.status} label={stuck ? t("admin.run.notFinished") : undefined} />;
}

/** The callout under the run banner: which tool calls did not succeed, with a way to each step. */
export function ToolProblemsNotice({ run, onOpenStep }: { run: Run; onOpenStep?: (nodeId: string) => void }) {
  const { t } = useTranslation();
  if (!FINISHED.has(run.status)) return null;
  const problems = toolProblems(run);
  // The tool-call records tell the most; a run without them (e.g. a sanitized trace) uses the backend's warnings.
  const warnings = problems.length ? [] : warningsOf(run as Run & WithWarnings);
  if (!problems.length && !warnings.length) return null;
  const count = problems.length || warnings.reduce((sum, item) => sum + (item.count ?? 1), 0);
  return (
    <div data-testid="tool-problems">
      <Callout tone="warning">
        <strong>{run.status === "succeeded" ? t("admin.run.withProblems") : t("admin.run.toolProblemsTitle")}</strong>{" "}
        {t("admin.run.toolProblemsText", { count })}
        <ul className="tool-problems small">
          {problems.map((problem) => (
            <li key={`${problem.nodeId}:${problem.call.id}`}>
              <strong>{problem.label}</strong> · <code>{problem.tool}</code>: {toolProblemText(t, problem)}
              {onOpenStep ? (
                <>
                  {" "}
                  <Button size="sm" variant="ghost" onClick={() => onOpenStep(problem.nodeId)}>
                    {t("runs.summary.openStep")}
                  </Button>
                </>
              ) : null}
            </li>
          ))}
          {warnings.map((warning, index) => {
            const node = warning.node_id ? run.workflow.nodes.find((item) => item.id === warning.node_id) : undefined;
            return (
              <li key={`w${index}`}>
                {node ? <strong>{node.label || node.id} · </strong> : null}
                {warning.tool ? <code>{warning.tool}</code> : null}
                {warning.tool ? ": " : null}
                {problemText(t, { code: warning.code })}
                {node && onOpenStep ? (
                  <>
                    {" "}
                    <Button size="sm" variant="ghost" onClick={() => onOpenStep(node.id)}>
                      {t("runs.summary.openStep")}
                    </Button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Callout>
    </div>
  );
}

/**
 * A run that ended while steps were still running or waiting (Nodestro was stopped or crashed): which steps did
 * not finish and that the run can be continued. A run cancelled by a normal shutdown is stored like a cancel by
 * hand and cannot be told apart here (backend item: a code of its own).
 */
export function InterruptedNotice({ run, onResume }: { run: Run; onResume?: () => void }) {
  const { t } = useTranslation();
  const steps = unfinishedSteps(run);
  const interrupted = run.error_code === "run.interrupted";
  if (!steps.length && !interrupted) return null;
  return (
    <div data-testid="run-interrupted">
      <Callout tone="warning">
        {steps.length
          ? t("admin.run.unfinished", { count: steps.length, steps: steps.map((step) => step.label).join(", ") })
          : run.error_params?.cause === "shutdown"
            ? t("admin.run.shutdown")
            : t("admin.run.interrupted")}{" "}
        {onResume ? (
          <>
            {t("admin.run.resumeHint")}{" "}
            <Button size="sm" icon={History} onClick={onResume}>
              {t("flow.resume.button")}
            </Button>
          </>
        ) : null}
      </Callout>
    </div>
  );
}
