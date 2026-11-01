import { ExternalLink, PanelBottomClose, PanelBottomOpen } from "lucide-react";
import { type Ref, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Output, outputFieldsOf } from "../components/Markdown";
import { IconButton, Stat } from "../components/ui";
import { formatCost, formatTokens, tokenBreakdown } from "../lib/format";
import { RunApprovals } from "../runs/ApprovalCard";
import { CancelRunButton } from "../runs/CancelRunButton";
import { RunProblem } from "../runs/RunProblem";
import { WaitingForYouBadge } from "../runs/WaitingForYouBadge";
import { InterruptedNotice, RunOutcome, StepStatus, ToolProblemsNotice } from "../runs/RunProblems";
import { RunToolApprovals } from "../runs/ToolApprovalCard";
import { useEditorLayout } from "./layout";
import { NodeRunDetails, startFiles } from "./RunDetails";
import { liveUsage, runWaitsForToolApproval, useEditor, waitsForToolApproval } from "./store";

/** The execution overview below the canvas. Collapsing or resizing it never touches the run. */
export function RunPanel({ panelRef }: { panelRef?: Ref<HTMLElement> }) {
  const { t } = useTranslation();
  const run = useEditor((s) => s.run);
  const nodes = useEditor((s) => s.nodes);
  const selectedId = useEditor((s) => s.selectedId);
  const open = useEditorLayout((state) => state.open.runPanel);
  const [focus, setFocus] = useState<string | null>(null);
  // A node picked on the canvas takes over from a step picked in the list.
  useEffect(() => setFocus(null), [selectedId]);
  const usage = liveUsage(run);
  const agents = nodes.filter((node) => node.type === "agent");
  const teams = nodes.reduce((sum, node) => sum + (node.type === "orchestrator" ? (node.orchestrator?.members.length ?? 0) : 0), 0);
  const shownId = (focus && run?.nodes[focus] ? focus : null) ?? (selectedId && run?.nodes[selectedId] ? selectedId : null);
  const shown = shownId ? run?.workflow.nodes.find((node) => node.id === shownId) ?? nodes.find((n) => n.id === shownId) : null;
  const live = run && (run.status === "running" || run.status === "queued");
  const paused = run?.status === "paused";
  // A tool call waits for a person: the run still counts as running, but nothing happens until someone decides.
  const waitingForYou = runWaitsForToolApproval(run);

  return (
    <section
      ref={panelRef}
      id="editor-run-panel"
      className={`run-panel ${open ? "" : "run-panel--closed"} ${run ? "" : "run-panel--idle"}`}
      aria-label={t("runs.panel.title")}
      data-testid="run-panel"
    >
      <div className="panel-head run-panel__head">
        <div className="row-gap">
          <IconButton
            icon={open ? PanelBottomClose : PanelBottomOpen}
            label={open ? t("editor.panels.hideRunPanel") : t("editor.panels.showRunPanel")}
            className="run-panel__toggle"
            aria-expanded={open}
            aria-controls="editor-run-panel"
            onClick={() => useEditorLayout.getState().toggle("runPanel")}
          />
          <h2 className="panel-head__title run-title">{t("runs.panel.title")}</h2>
        </div>
        <div className="row-gap">
          {run ? (
            waitingForYou ? (
              <WaitingForYouBadge />
            ) : (
              <RunOutcome run={run} label={live ? t("status.running.label") : undefined} />
            )
          ) : (
            <span className="muted small">{t("runs.panel.notStarted")}</span>
          )}
          {run && (live || paused) ? <CancelRunButton runId={run.id} size="sm" /> : null}
          {run && !live ? (
            <Link className="small" to={`/executions/${run.id}`}>
              {t("common.details")} <ExternalLink size={11} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
      {open ? (
        <div className="run-panel__body">
          <div className="stats stats--inline">
            {/* An orchestrated workflow has no agents of its own: it shows the teams of its pool instead (F10). */}
            {!agents.length && teams ? (
              <Stat label={t("runs.stats.teams")} value={teams} />
            ) : (
              <Stat label={t("runs.stats.agents")} value={agents.length} />
            )}
            <Stat label={t("runs.stats.requests")} value={usage.requests} tip="runs.requests" />
            <Stat
              label={t("runs.stats.tokens")}
              value={formatTokens(usage.total_tokens)}
              hint={usage.requests ? tokenBreakdown(usage) : undefined}
              tip="runs.tokens"
            />
            <Stat label={t("runs.stats.cost")} value={formatCost(usage.estimated_cost_usd)} tip="runs.cost" />
          </div>
          {run ? (
            <div className="run-panel__details">
              <ul className="run-steps">
                {run.workflow.nodes
                  .filter((node) => node.type !== "start" && node.type !== "output")
                  .map((node) => {
                    const state = run.nodes[node.id];
                    return (
                      <li key={node.id}>
                        <button
                          type="button"
                          className={`run-step ${shownId === node.id ? "selected" : ""}`}
                          aria-current={shownId === node.id || undefined}
                          onClick={() => setFocus(node.id)}
                        >
                          <span>{node.label}</span>
                          {waitsForToolApproval(state) ? <WaitingForYouBadge /> : state ? <StepStatus run={run} state={state} /> : null}
                        </button>
                      </li>
                    );
                  })}
                <li>
                  <button
                    type="button"
                    className={`run-step ${shownId === null ? "selected" : ""}`}
                    aria-current={shownId === null || undefined}
                    onClick={() => {
                      setFocus(null);
                      useEditor.getState().select(null);
                    }}
                  >
                    <span>{t("runs.panel.overall")}</span>
                  </button>
                </li>
              </ul>
              <div className="run-panel__focus">
                {shown && shownId && run.nodes[shownId] ? (
                  <NodeRunDetails node={shown} state={run.nodes[shownId]} runFiles={startFiles(run, shownId)} run={run} />
                ) : (
                  <div className="node-run">
                    <RunProblem run={run} />
                    <InterruptedNotice run={run} />
                    <ToolProblemsNotice run={run} onOpenStep={setFocus} />
                    {paused ? <RunApprovals run={run} /> : null}
                    {run.status === "running" || run.status === "paused" ? <RunToolApprovals run={run} /> : null}
                    {live ? (
                      <p className="muted">{waitingForYou ? t("runs.panel.waitingForTool") : t("runs.panel.running")}</p>
                    ) : paused ? null : (
                      <Output value={run.output} fields={outputFieldsOf(run.workflow.nodes, "", run.output)} />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

