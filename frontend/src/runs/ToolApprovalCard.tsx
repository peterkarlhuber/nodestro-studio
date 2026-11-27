// A tool call that waits for a person (per-call approvals): the tool, what it may do, the exact arguments it
// will be sent, the time left, an optional comment, and approve or reject. Nothing is approved automatically;
// a question nobody answers in time counts as rejected, and a decision about a changed call is refused.

import { RememberOptions } from "@nodestro/ui-ai";
import { UiTextProvider, type Translate } from "@nodestro/ui-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldQuestion, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAccess } from "../api/access";
import { ApiError, api } from "../api/client";
import { keys, useAccessGrantsEnabled, useToolApprovals } from "../api/hooks";
import type { AccessDeny, AccessGrant, Run, ToolApprovalRequest, ToolCallApproval } from "../api/types";
import { Badge, Button, Callout, Field, HelpTip, Spinner, TextArea } from "../components/ui";
import { toast } from "../components/toast";
import { ErrorText, problemText } from "../lib/errors";
import { formatDate } from "../lib/format";
import { WorkflowToolApprovalForm, mayBeWorkflowTool, workflowToolOf } from "../workflowTools/WorkflowToolApproval";

/** Seconds until ``deadline`` (negative once it passed), updated every second. */
export function useSecondsLeft(deadline: string): number {
  const [at, setAt] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setAt(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return Math.floor((new Date(deadline).getTime() - at) / 1000);
}

export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * Where the call waits, by name: the workflow and the step's label from the run (AD-11). The approval list carries
 * only ids (backend item: workflow name, node label and path); until the run has loaded, the step id stands in.
 */
export function ToolApprovalContext({ request }: { request: Pick<ToolApprovalRequest, "run_id" | "node_id"> }) {
  const { t } = useTranslation();
  const run = useQuery({ queryKey: keys.run(request.run_id), queryFn: () => api.run(request.run_id), staleTime: 60_000, retry: false });
  const node = run.data?.workflow.nodes.find((item) => item.id === request.node_id);
  const step = node?.label || node?.agent?.name || request.node_id;
  if (!run.data) return <>{t("approvals.tool.inRun", { node: step })}</>;
  return <span data-testid="tool-approval-context">{t("admin.approval.inWorkflow", { workflow: run.data.workflow_name, step })}</span>;
}

/** Codes of a decision that came too late or about another call: the list is reloaded to show what is current. */
const CONFLICTS = new Set(["tool.approval_stale", "tool.approval_expired", "tool.approval_decided"]);

/** How long a decision on the card holds (access model v2, N-06): this call only, or as a grant or deny. */
export type RememberFor = "call" | "until_revoked" | "until";
/** For whom it holds: the agent that asked, or every agent. */
export type RememberScope = "agent" | "all";

export interface RememberChoice {
  duration: RememberFor;
  scope: RememberScope;
  /** ``until``: the end, as a datetime-local value. */
  until: string;
}

/**
 * Whether approving can be remembered as a grant (L-2): never for a tool that deletes for good (each such call needs a
 * confirmation; the API refuses it too) or an MCP tool (its own rules decide; a grant would not count). Rejecting can
 * always be remembered as a deny. An MCP tool's request names its definition hash.
 */
export function grantable(request: Pick<ToolApprovalRequest, "capability" | "definition_hash">): boolean {
  return request.capability.access !== "destructive" && !request.definition_hash;
}

/**
 * The grant (approved) or deny (rejected) a decision on the card also stores, or null for "this call only". The agent
 * is named like the runtime names it: ``<workflow id>/<node id>``. Always for supervised use: a person watches here.
 */
export function rememberedRule(request: Pick<ToolApprovalRequest, "tool" | "node_id">, workflowId: string | undefined, choice: RememberChoice) {
  if (choice.duration === "call") return null;
  // Never wider than chosen: without the workflow (its run not loaded yet) there is no agent to name.
  if (choice.scope === "agent" && !workflowId) return null;
  const agents = choice.scope === "agent" ? [`${workflowId}/${request.node_id}`] : [];
  const expires = choice.duration === "until" && choice.until ? new Date(choice.until).toISOString() : null;
  return {
    resource_type: "tool" as const,
    resource_id: request.tool,
    actions: ["execute" as const],
    duration: choice.duration,
    scope: agents.length ? ("agent" as const) : ("all" as const),
    agents,
    mode: "supervised" as const,
    expires_at: expires,
  };
}

/**
 * The keys of the package's remember options, answered with the studio's own texts (the wording stays as it was before
 * the card used the package).
 */
export const REMEMBER_TEXTS = {
  "ai.remember.title": "approvals.tool.remember.title",
  "ai.remember.duration": "approvals.tool.remember.duration",
  "ai.remember.durations.call": "approvals.tool.remember.durations.call",
  "ai.remember.durations.until_revoked": "approvals.tool.remember.durations.until_revoked",
  "ai.remember.durations.until": "approvals.tool.remember.durations.until",
  "ai.remember.scope": "approvals.tool.remember.scope",
  "ai.remember.scopes.agent": "approvals.tool.remember.scopes.agent",
  "ai.remember.scopes.all": "approvals.tool.remember.scopes.all",
  "ai.remember.until": "approvals.tool.remember.until",
  "ai.remember.hint": "approvals.tool.remember.hint",
} as const;
type RememberText = keyof typeof REMEMBER_TEXTS;

/**
 * Scope and duration of a decision, shown only while grants and denies are on and to someone who may write them
 * (``admin``); hidden otherwise, so the card stays as before. The fields are the shared package's (N-16,
 * @nodestro/ui-ai RememberOptions) with the studio's texts; what is stored stays the studio's decision.
 */
function RememberDecision({
  request,
  workflowId,
  choice,
  onChange,
}: {
  request: ToolApprovalRequest;
  workflowId: string | undefined;
  choice: RememberChoice;
  onChange: (choice: RememberChoice) => void;
}) {
  const { t, i18n } = useTranslation();
  const agent = workflowId ? `${workflowId}/${request.node_id}` : request.node_id;
  const translate = useCallback<Translate>(
    (key, values) => {
      if (!(key in REMEMBER_TEXTS)) return undefined;
      const studioKey = REMEMBER_TEXTS[key as RememberText];
      return t(studioKey, values);
    },
    [t],
  );
  return (
    <UiTextProvider locale={i18n.language} translate={translate}>
      <RememberOptions value={choice} onChange={onChange} agent={agent} data-testid="tool-approval-remember">
        {choice.duration !== "call" && !grantable(request) ? (
          <p className="small" data-testid="tool-approval-remember-reject-only">
            {request.capability.access === "destructive" ? t("approvals.tool.remember.onlyRejectDestructive") : t("approvals.tool.remember.onlyRejectMcp")}
          </p>
        ) : null}
      </RememberOptions>
    </UiTextProvider>
  );
}

/**
 * The card of one request: a workflow tool's start (N-20) gets the workflow's card (version, arguments, what it may
 * do), every other call the tool card. Which one comes from the agent in the run; a request whose capability was
 * computed from content waits for the run before choosing, so its card does not change under the person's hands.
 */
export function ToolApprovalForm({ request, showContext = false }: { request: ToolApprovalRequest; showContext?: boolean }) {
  const { t } = useTranslation();
  const candidate = mayBeWorkflowTool(request);
  const run = useQuery({
    queryKey: keys.run(request.run_id),
    queryFn: () => api.run(request.run_id),
    staleTime: 60_000,
    retry: false,
    enabled: candidate,
  });
  if (candidate && run.isPending) return <Spinner label={t("approvals.tool.cardLabel", { name: request.tool })} />;
  const binding = candidate ? workflowToolOf(run.data, request) : null;
  if (binding) return <WorkflowToolApprovalForm request={request} binding={binding} showContext={showContext} />;
  return <StandardToolApprovalForm request={request} showContext={showContext} />;
}

function StandardToolApprovalForm({ request, showContext = false }: { request: ToolApprovalRequest; showContext?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [choice, setChoice] = useState<RememberChoice>({ duration: "call", scope: "agent", until: "" });
  // Scope and duration only while grants and denies are on (N-06) and for someone who may write them.
  const accessOn = useAccessGrantsEnabled();
  const admin = useAccess().can("admin");
  const canRemember = accessOn && admin;
  const run = useQuery({
    queryKey: keys.run(request.run_id),
    queryFn: () => api.run(request.run_id),
    staleTime: 60_000,
    retry: false,
    enabled: canRemember,
  });
  const workflowId = run.data?.workflow_id;
  // A chosen grant or deny must be complete before deciding: a date for "until", the agent's workflow for "agent".
  const incomplete =
    canRemember &&
    choice.duration !== "call" &&
    ((choice.duration === "until" && !choice.until) || (choice.scope === "agent" && !workflowId));
  const secondsLeft = useSecondsLeft(request.deadline);
  const expired = secondsLeft <= 0;
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.toolApprovals });
    void queryClient.invalidateQueries({ queryKey: keys.run(request.run_id) });
  };
  // The decision of this call stands on its own; a grant or deny that cannot be stored is reported separately.
  const remember = useMutation<
    AccessGrant | AccessDeny,
    Error,
    { decision: "approved" | "rejected"; rule: NonNullable<ReturnType<typeof rememberedRule>> }
  >({
    mutationFn: ({ decision, rule }) => {
      // L-1: the tool as the person saw it; the API refuses the grant when the library holds another one now.
      if (decision === "approved")
        return api.grantAccess({ ...rule, expected: { version: request.version, definition_hash: request.definition_hash } });
      // A deny from the card blocks in both modes (no ``mode``): what a person refuses here stays refused unattended.
      const { resource_type, resource_id, actions, scope, agents, expires_at, duration } = rule;
      return api.denyAccess({ resource_type, resource_id, actions, scope, agents, expires_at, duration });
    },
    onSuccess: (_answer, { decision }) => {
      toast.success(decision === "approved" ? t("approvals.tool.remember.grantedToast") : t("approvals.tool.remember.deniedToast"));
      void queryClient.invalidateQueries({ queryKey: keys.accessGrants });
      void queryClient.invalidateQueries({ queryKey: keys.accessDenies });
    },
  });
  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected") =>
      api.decideToolApproval(request.run_id, request.id, decision, request.arguments_hash, comment),
    onSuccess: (_answer, decision) => {
      toast.success(decision === "approved" ? t("approvals.tool.approvedToast") : t("approvals.tool.rejectedToast"));
      const rule = canRemember && (decision === "rejected" || grantable(request)) ? rememberedRule(request, workflowId, choice) : null;
      if (rule) remember.mutate({ decision, rule });
      refresh();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code && CONFLICTS.has(error.code)) refresh();
    },
  });
  const { access, reach } = request.capability;
  return (
    <section className="approval-card" aria-label={t("approvals.tool.cardLabel", { name: request.tool })} data-testid="tool-approval">
      <header className="approval-card__head">
        <ShieldQuestion size={15} aria-hidden />
        <div>
          <strong>{t("approvals.tool.title", { name: request.tool })}</strong>
          <div className="muted small">
            {showContext ? (
              <>
                <Link to={`/executions/${request.run_id}`}>
                  <ToolApprovalContext request={request} />
                </Link>
                {" · "}
              </>
            ) : null}
            {t("approvals.waitingSince", { time: formatDate(request.requested_at) })}
          </div>
        </div>
        <HelpTip id="tools.callApproval" label={t("approvals.tool.help")} />
      </header>
      <div className="row-gap">
        <Badge tone={access === "destructive" ? "danger" : access === "write" ? "warning" : "idle"}>
          {t(`approvals.tool.access.${access}`, { defaultValue: access })}
        </Badge>
        <Badge tone={reach === "external" ? "warning" : "idle"}>{t(`approvals.tool.reach.${reach}`, { defaultValue: reach })}</Badge>
        {request.capability.source === "default" ? <Badge tone="idle">{t("approvals.tool.capabilityUnknown")}</Badge> : null}
      </div>
      <span className="nd-field-label">{t("approvals.tool.arguments")}</span>
      <pre className="code-block" data-testid="tool-approval-arguments">
        {JSON.stringify(request.input, null, 2)}
      </pre>
      <p className={`small ${expired ? "text-danger" : "muted"}`} data-testid="tool-approval-deadline">
        {expired ? t("approvals.tool.expired") : t("approvals.tool.timeLeft", { time: formatCountdown(secondsLeft) })}
      </p>
      <Field label={t("approvals.comment")} hint={t("approvals.tool.commentHint")}>
        <TextArea rows={2} value={comment} maxLength={4000} onChange={(e) => setComment(e.target.value)} />
      </Field>
      {canRemember ? <RememberDecision request={request} workflowId={workflowId} choice={choice} onChange={setChoice} /> : null}
      <p className="muted small">{t("approvals.tool.rejectHint")}</p>
      {decide.error ? (
        <Callout tone="danger">
          <ErrorText error={decide.error} />
        </Callout>
      ) : null}
      {remember.error ? (
        <Callout tone="danger">
          <strong>{t("approvals.tool.remember.failed")}</strong> <ErrorText error={remember.error} />
        </Callout>
      ) : null}
      <div className="row-gap">
        <Button
          variant="primary"
          icon={Check}
          busy={decide.isPending && decide.variables === "approved"}
          disabled={decide.isPending || expired || (incomplete && grantable(request))}
          onClick={() => decide.mutate("approved")}
        >
          {t("approvals.tool.approve")}
        </Button>
        <Button
          variant="danger"
          icon={X}
          busy={decide.isPending && decide.variables === "rejected"}
          disabled={decide.isPending || expired || incomplete}
          onClick={() => decide.mutate("rejected")}
        >
          {t("approvals.reject")}
        </Button>
      </div>
    </section>
  );
}

/** The open tool approvals of a running run (shown while it waits; the run itself stays "running"). */
/**
 * The run says a call waits (from its events or a fresh copy) but the list of open requests does not have it yet:
 * read the list at once instead of waiting for its next regular poll.
 */
function useReadMissingRequests(run: Run, requests: ToolApprovalRequest[] | undefined) {
  const queryClient = useQueryClient();
  const known = new Set((requests ?? []).map((item) => item.id));
  const missing = Object.values(run.nodes)
    .flatMap((state) => state.tool_calls ?? [])
    .filter((call) => call.approval?.status === "pending" && call.approval.request_id && !known.has(call.approval.request_id))
    .map((call) => call.approval?.request_id)
    .join(",");
  useEffect(() => {
    if (missing) void queryClient.invalidateQueries({ queryKey: keys.toolApprovals });
  }, [missing, queryClient]);
}

export function RunToolApprovals({ run }: { run: Run }) {
  const { t } = useTranslation();
  const approvals = useToolApprovals();
  // A run paused at a tool call (M6b) may wait in one of its teams' or sub-workflows' runs.
  const ids = new Set([run.id, ...Object.values(run.nodes).flatMap((state) => [state.child_run_id, ...(state.child_run_ids ?? [])])]);
  const waiting = (approvals.data ?? []).filter((item) => ids.has(item.run_id) && item.status === "pending");
  useReadMissingRequests(run, approvals.data);
  if (!waiting.length) return null;
  return (
    <Callout tone="warning">
      <strong>{t("approvals.tool.runWaiting")}</strong>
      {waiting.map((item) => (
        <ToolApprovalForm key={item.id} request={item} />
      ))}
    </Callout>
  );
}

/** The open tool approvals of one running step. */
export function NodeToolApprovals({ runId, nodeId }: { runId: string; nodeId: string }) {
  const approvals = useToolApprovals();
  const waiting = (approvals.data ?? []).filter((item) => item.run_id === runId && item.node_id === nodeId && item.status === "pending");
  return (
    <>
      {waiting.map((item) => (
        <ToolApprovalForm key={item.id} request={item} />
      ))}
    </>
  );
}

/** One line on what the approval rules did with a recorded call. */
export function ToolCallApprovalNote({ approval }: { approval: ToolCallApproval }) {
  const { t } = useTranslation();
  if (approval.status === "allowed" && !approval.pre_grant_id) return null;
  const parts = [t(`approvals.tool.status.${approval.status}`)];
  if (approval.pre_grant_id) parts.push(t("approvals.tool.preGranted"));
  if (approval.decided_by) parts.push(t("approvals.tool.decidedBy", { name: approval.decided_by, time: formatDate(approval.decided_at) }));
  if (approval.status === "denied" && approval.code) parts.push(problemText(t, { code: approval.code }));
  return (
    <p className="muted small" data-testid="tool-call-approval">
      {[...parts, ...(approval.comment ? [t("approvals.tool.comment", { comment: approval.comment })] : [])].join(" · ")}
    </p>
  );
}
