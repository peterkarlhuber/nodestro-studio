import { ChevronDown, ChevronUp, ExternalLink, Square } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { Output } from "../components/Markdown";
import { toast } from "../components/toast";
import { Button, Callout, Hint, Stat, StatusBadge } from "../components/ui";
import { ProblemText, runProblem } from "../lib/errors";
import { formatCost, formatTokens, tokenBreakdown } from "../lib/format";
import { RunApprovals } from "../runs/ApprovalCard";
import { NodeRunDetails, startFiles } from "./RunDetails";
import { liveUsage, useEditor } from "./store";

/** The execution overview below the canvas. */
export function RunPanel() {
  const { t } = useTranslation();
  const run = useEditor((s) => s.run);
  const nodes = useEditor((s) => s.nodes);
  const selectedId = useEditor((s) => s.selectedId);
  const [open, setOpen] = useState(true);
  const [focus, setFocus] = useState<string | null>(null);
  const usage = liveUsage(run);
  const agents = nodes.filter((node) => node.type === "agent");
  const shownId = (focus && run?.nodes[focus] ? focus : null) ?? (selectedId && run?.nodes[selectedId] ? selectedId : null);
  const shown = shownId ? run?.workflow.nodes.find((node) => node.id === shownId) ?? nodes.find((n) => n.id === shownId) : null;
  const live = run && (run.status === "running" || run.status === "queued");
  const paused = run?.status === "paused";

  return (
    <section className={`run-panel ${open ? "" : "run-panel--closed"}`} aria-label={t("runs.panel.title")}>
      <div className="run-panel__head">
        <button type="button" className="run-title" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? <ChevronDown size={14} aria-hidden /> : <ChevronUp size={14} aria-hidden />}
          {t("runs.panel.title")}
        </button>
        <div className="row-gap">
          {run ? <StatusBadge status={run.status} label={live ? t("status.running.label") : undefined} /> : <span className="muted small">{t("runs.panel.notStarted")}</span>}
          {live || paused ? (
            <Hint id="runs.cancel">
              <Button size="sm" icon={Square} onClick={() => api.cancelRun(run.id).catch(toast.error)}>
                {t("common.cancel")}
              </Button>
            </Hint>
          ) : null}
          {run && !live ? (
            <Link className="small" to={`/executions/${run.id}`}>
              {t("common.details")} <ExternalLink size={11} aria-hidden />
            </Link>
          ) : null}
        </div>
      </div>
      {open ? (
        <div className="run-panel__body">
          <div className="stats">
            <Stat label={t("runs.stats.agents")} value={agents.length} />
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
              <div className="run-steps" role="list">
                {run.workflow.nodes
                  .filter((node) => node.type !== "start" && node.type !== "output")
                  .map((node) => {
                    const state = run.nodes[node.id];
                    return (
                      <button
                        key={node.id}
                        type="button"
                        role="listitem"
                        className={`run-step ${shownId === node.id ? "selected" : ""}`}
                        onClick={() => setFocus(node.id)}
                      >
                        <span>{node.label}</span>
                        {state ? <StatusBadge status={state.status} /> : null}
                      </button>
                    );
                  })}
                <button
                  type="button"
                  role="listitem"
                  className={`run-step ${shownId === null ? "selected" : ""}`}
                  onClick={() => {
                    setFocus(null);
                    useEditor.getState().select(null);
                  }}
                >
                  <span>{t("runs.panel.overall")}</span>
                </button>
              </div>
              <div className="run-panel__focus">
                {shown && shownId && run.nodes[shownId] ? (
                  <NodeRunDetails node={shown} state={run.nodes[shownId]} runFiles={startFiles(run, shownId)} run={run} />
                ) : (
                  <div className="node-run">
                    {run.error ? (
                      <Callout tone="danger">
                        <ProblemText item={runProblem(run)} />
                      </Callout>
                    ) : null}
                    {paused ? <RunApprovals run={run} /> : null}
                    {live ? <p className="muted">{t("runs.panel.running")}</p> : paused ? null : <Output value={run.output} />}
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
