// Continue a failed or cancelled run: reuse what is still valid, run the rest again.
// The failed run stays as it was; the continuation is a new, linked run.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import type { ResumeAction } from "../api/types";
import { Badge, Button, Callout, HelpTip, Modal, Spinner, Toggle } from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";
import { formatCost } from "../lib/format";

const TONE: Record<ResumeAction, "success" | "warning" | "running"> = { reuse: "success", rerun: "warning", run: "running" };

export function ResumeDialog({ runId, open, onClose }: { runId: string; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const plan = useQuery({ queryKey: ["resume-plan", runId], queryFn: () => api.resumePlan(runId), enabled: open });
  const start = useMutation({
    mutationFn: (mode: "continue" | "restart") => api.resumeRun(runId, mode, confirmed),
    onSuccess: (run) => {
      void queryClient.invalidateQueries({ queryKey: ["runs"] });
      onClose();
      navigate(`/executions/${run.id}`);
    },
  });
  const data = plan.data;
  const blocking = data?.issues.filter((issue) => issue.level === "error") ?? [];
  const notes = data?.issues.filter((issue) => issue.level !== "error") ?? [];
  return (
    <Modal
      title={t("flow.resume.title")}
      open={open}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            icon={RotateCcw}
            disabled={!data?.can_restart || start.isPending}
            busy={start.isPending && start.variables === "restart"}
            onClick={() => start.mutate("restart")}
          >
            {t("flow.resume.restart")}
          </Button>
          <Button
            variant="primary"
            icon={Play}
            disabled={!data?.possible || (data.needs_confirmation && !confirmed) || start.isPending}
            busy={start.isPending && start.variables === "continue"}
            onClick={() => start.mutate("continue")}
          >
            {t("flow.resume.continue")}
          </Button>
        </>
      }
    >
      <p className="muted">
        {t("flow.resume.intro")} <HelpTip id="flow.resume" label={t("flow.resume.title")} />
      </p>
      {plan.isLoading ? <Spinner /> : null}
      {plan.error ? (
        <Callout tone="danger">
          <ErrorText error={plan.error} />
        </Callout>
      ) : null}
      {data ? (
        <>
          {data.possible ? (
            <Callout tone="brand">
              <History size={13} aria-hidden />{" "}
              {t("flow.resume.summary", { reused: data.reused, rerun: data.rerun, saved: formatCost(data.saved_cost_usd) })}
            </Callout>
          ) : null}
          {blocking.map((issue, index) => (
            <Callout key={`e${index}`} tone="danger">
              <ProblemText item={issue} />
            </Callout>
          ))}
          {notes.map((issue, index) => (
            <Callout key={`n${index}`} tone={issue.level === "warning" ? "warning" : "info"}>
              <ProblemText item={issue} />
            </Callout>
          ))}
          <table className="table" aria-label={t("flow.resume.steps")}>
            <thead>
              <tr>
                <th>{t("flow.resume.step")}</th>
                <th>{t("flow.resume.action")}</th>
                <th>{t("flow.resume.reason")}</th>
              </tr>
            </thead>
            <tbody>
              {data.nodes
                .filter((node) => node.type !== "start" && node.type !== "output")
                .map((node) => (
                  <tr key={node.node_id}>
                    <td>{node.label}</td>
                    <td>
                      <Badge tone={TONE[node.action]}>{t(`flow.resume.actions.${node.action}`)}</Badge>
                    </td>
                    <td className="small">
                      {node.reason ? t(`flow.resume.reasons.${node.reason.replace("resume.", "")}`, { defaultValue: node.reason }) : null}
                      {node.side_effects.length ? (
                        <div className="text-warning">{t("flow.resume.calledTools", { tools: node.side_effects.join(", ") })}</div>
                      ) : null}
                      {node.saved_cost_usd ? (
                        <div className="muted">{t("flow.resume.saved", { cost: formatCost(node.saved_cost_usd) })}</div>
                      ) : null}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {data.needs_confirmation ? (
            <Toggle
              checked={confirmed}
              onChange={setConfirmed}
              label={t("flow.resume.confirm")}
              description={t("flow.resume.confirmHint")}
              tip="flow.resumeSideEffects"
            />
          ) : null}
        </>
      ) : null}
      {start.error ? (
        <Callout tone="danger">
          <ErrorText error={start.error} />
        </Callout>
      ) : null}
    </Modal>
  );
}
