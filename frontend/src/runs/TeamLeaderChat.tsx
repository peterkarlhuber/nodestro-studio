// "Team leader" area of the run page (LRC-1): ask the orchestrators of a run questions (read-only answers) and give
// them instructions that their next decision takes into account. Teams already working are never interrupted.

import { HelpCircle, Loader2, MessageSquareText, Send, Users } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import type { ChatTarget, RunChatView, RunMessage, TeamActivity } from "../api/types";
import { PermissionNote } from "../components/Access";
import { Badge, Button, Callout, DocLink, Field, Segmented, Spinner, StatusBadge, TextArea } from "../components/ui";
import { ErrorText, problemText } from "../lib/errors";
import { STATUS_TONE, formatCost, formatNumber, formatTime } from "../lib/format";
import {
  type ChatEntry,
  type ChatMode,
  composerClosed,
  conversationEntries,
  decisionView,
  messageStatus,
  newClientId,
  pickTarget,
  questionsLeft,
  remainingBudget,
  steeringCode,
  targetKey,
  workingTeams,
} from "./runChatModel";
import { useRunChat } from "./useRunChat";

type KnownStatus = keyof typeof STATUS_TONE;
const isKnownStatus = (status: string): status is KnownStatus => status in STATUS_TONE;

/** A run or node status as a badge; an unknown one as plain text. */
function TargetStatus({ status }: { status: string }) {
  return isKnownStatus(status) ? <StatusBadge status={status} /> : <Badge>{status}</Badge>;
}

/** The team leaders of the run (several with nested teams): label, path, level and status. */
function TargetPicker({ targets, selected, onSelect }: { targets: ChatTarget[]; selected: string; onSelect: (key: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="lrc-targets" role="radiogroup" aria-label={t("runChat.targets.label")}>
      {targets.map((target) => {
        const key = targetKey(target);
        const active = key === selected;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            className={`lrc-target ${active ? "selected" : ""}`}
            onClick={() => onSelect(key)}
            data-testid="lrc-target"
            data-target={key}
          >
            <span className="lrc-target__head">
              <strong>{target.label || target.node_id}</strong>
              <TargetStatus status={target.status} />
            </span>
            <span className="muted small lrc-target__path">
              {[...target.path, target.workflow_name].filter(Boolean).join(" › ")}
            </span>
            {target.depth > 0 ? <span className="muted small">{t("runChat.targets.depth", { level: target.depth })}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** What the team leader is doing now: decisions made, teams and their working specialists. */
function TargetActivity({ target }: { target: ChatTarget }) {
  const { t } = useTranslation();
  const working = workingTeams(target);
  return (
    <section className="lrc-activity" aria-label={t("runChat.activity.title")}>
      <div className="lrc-activity__line">
        <Users size={14} aria-hidden />
        <span>
          {t("runChat.activity.decisions", { used: formatNumber(target.decisions), max: formatNumber(target.max_decisions) })}
        </span>
        <span className="muted small">
          {working.length ? t("runChat.activity.working", { count: working.length }) : t("runChat.activity.noneWorking")}
        </span>
      </div>
      {target.teams.length ? (
        <ul className="lrc-teams">
          {target.teams.map((team) => (
            <li key={team.child_run_id || `${team.member}-${team.slot ?? ""}`} className="lrc-team">
              <span className="lrc-team__name">{team.name || team.member}</span>
              <TargetStatus status={team.status} />
              {team.working.length ? (
                <span className="muted small lrc-team__working">{t("runChat.activity.specialists", { names: team.working.join(", ") })}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** The badge of a message's status, with the reason of a refusal. */
function MessageStatusLine({ message, teams }: { message: RunMessage; teams: TeamActivity[] }) {
  const { t } = useTranslation();
  const status = messageStatus(message);
  if (!status) return null;
  const working = message.kind === "instruction" && message.status === "queued" ? workingTeams({ teams }).length : 0;
  const decision = message.kind === "instruction" && message.status === "considered" ? decisionView(message, teams) : null;
  return (
    <div className="lrc-status-line">
      <span className={`nd-badge nd-badge--${status.tone} lrc-status`} data-testid="lrc-status" data-status={message.status}>
        {status.busy ? <Loader2 size={11} className="spin" aria-hidden /> : null}
        {t(status.text.key, status.text.values)}
      </span>
      {working ? <span className="muted small">{t("runChat.status.queuedWorking", { count: working })}</span> : null}
      {decision ? (
        <span className="small lrc-decision">
          {decision.accepted
            ? decision.teams.length
              ? t("runChat.decision.withTeams", { action: t(decision.actionKey), teams: decision.teams.join(", ") })
              : t("runChat.decision.only", { action: t(decision.actionKey) })
            : t("runChat.decision.invalid")}
        </span>
      ) : null}
      {status.code ? <span className="small lrc-reason">{problemText(t, { code: status.code })}</span> : null}
    </div>
  );
}

function Author({ message }: { message: RunMessage }) {
  const { t } = useTranslation();
  return (
    <span className="muted small lrc-message__meta">
      {t(`runChat.kind.${message.kind}`)} · {message.author_name || message.author || t("runChat.someone")} · {formatTime(message.created_at)}
    </span>
  );
}

/** A question with its answer, an instruction with its status. */
function Entry({ entry, teams }: { entry: ChatEntry; teams: TeamActivity[] }) {
  const { message, answer } = entry;
  return (
    <li className={`lrc-message lrc-message--${message.kind}`} data-testid="lrc-message" data-kind={message.kind} data-status={message.status}>
      <Author message={message} />
      <p className="lrc-message__text">{message.content}</p>
      <MessageStatusLine message={message} teams={teams} />
      {answer ? <Answer message={answer} /> : null}
    </li>
  );
}

function Answer({ message }: { message: RunMessage }) {
  const { t } = useTranslation();
  return (
    <div className="lrc-answer" data-testid="lrc-answer">
      <span className="muted small lrc-message__meta">
        <MessageSquareText size={12} aria-hidden /> {t("runChat.answer.label")}
        {message.snapshot_at ? ` · ${t("runChat.answer.snapshot", { time: formatTime(message.snapshot_at) })}` : ""}
      </span>
      <p className="lrc-message__text">{message.content}</p>
    </div>
  );
}

/** Ask or instruct: two explicit modes, the hint of each, the length and what is left. */
function Composer({
  view,
  target,
  send,
}: {
  view: RunChatView;
  target: ChatTarget | null;
  send: ReturnType<typeof useRunChat>["send"];
}) {
  const { t } = useTranslation();
  const canRun = useAccess().can("run");
  const [mode, setMode] = useState<ChatMode>("question");
  const [text, setText] = useState("");
  // One id per composed message: a retry after an error sends the same id, so nothing is stored twice.
  const clientId = useRef<string>(newClientId());
  const renew = () => {
    clientId.current = newClientId();
    send.reset();
  };
  const closed = composerClosed(view, target);
  const steering = steeringCode(target);
  const blockedMode = mode === "instruction" && steering !== null;
  const max = view.max_chars > 0 ? view.max_chars : 2000;
  const trimmed = text.trim();
  const disabled = Boolean(closed) || !canRun;
  const canSend = !disabled && !blockedMode && !send.isPending && trimmed.length > 0 && text.length <= max && target !== null;
  const submit = () => {
    if (!canSend || !target) return;
    send.mutate(
      { kind: mode, target_run_id: target.run_id, node_id: target.node_id, content: trimmed, client_id: clientId.current },
      {
        onSuccess: () => {
          setText("");
          clientId.current = newClientId();
        },
      },
    );
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };
  const budget = remainingBudget(view);
  const left = questionsLeft(view);
  const sendLabel = mode === "question" ? t("runChat.composer.sendQuestion") : t("runChat.composer.sendInstruction");
  return (
    <div className="lrc-composer">
      {closed ? (
        <p className="muted small lrc-closed" data-testid="lrc-closed">
          {t(closed.key)}
        </p>
      ) : null}
      <PermissionNote permission="run" />
      <Segmented<ChatMode>
        label={t("runChat.composer.mode")}
        value={mode}
        disabled={disabled}
        onChange={(next) => {
          setMode(next);
          renew();
        }}
        options={[
          { value: "question", label: t("runChat.mode.question"), icon: HelpCircle, testId: "lrc-mode-question" },
          { value: "instruction", label: t("runChat.mode.instruction"), icon: Send, disabled: steering !== null, testId: "lrc-mode-instruction" },
        ]}
      />
      <p className="small lrc-hint" data-testid="lrc-hint">
        {mode === "question" ? t("runChat.mode.questionHint") : t("runChat.mode.instructionHint")}
      </p>
      {steering && !closed ? (
        <p className="small lrc-reason" data-testid="lrc-steering-off">
          {t("runChat.composer.noInstructions", { reason: problemText(t, { code: steering }) })}
        </p>
      ) : null}
      <Field
        label={mode === "question" ? t("runChat.composer.questionLabel") : t("runChat.composer.instructionLabel")}
        hint={t("runChat.composer.keys")}
      >
        <TextArea
          value={text}
          rows={3}
          maxLength={max}
          disabled={disabled || blockedMode}
          onChange={(event) => {
            setText(event.target.value);
            if (send.isError) renew();
          }}
          onKeyDown={onKeyDown}
          data-testid="lrc-input"
        />
      </Field>
      <div className="lrc-composer__foot">
        <span className={`small lrc-count ${text.length >= max ? "text-warning" : "muted"}`} aria-live="polite">
          {t("runChat.composer.count", { used: formatNumber(text.length), max: formatNumber(max) })}
        </span>
        <Button variant="primary" icon={Send} onClick={submit} disabled={!canSend} data-testid="lrc-send">
          {send.isPending ? t("runChat.composer.sending") : sendLabel}
        </Button>
      </div>
      {send.isError ? (
        <Callout tone="danger">
          <ErrorText error={send.error} />
        </Callout>
      ) : null}
      <p className="muted small lrc-meta" data-testid="lrc-meta">
        {t("runChat.meta.budget", { value: budget === null ? t("runChat.meta.unknown") : formatCost(budget) })}
        {" · "}
        {t("runChat.meta.questions", { value: left === null ? t("runChat.meta.unknown") : formatNumber(left) })}
        {view.answer_model ? ` · ${t("runChat.meta.model", { model: view.answer_model })}` : ""}
      </p>
    </div>
  );
}

/** The conversation with the team leaders of a run, followed live; read-only once the run ended. */
export function TeamLeaderChat({ runId }: { runId: string }) {
  const { t } = useTranslation();
  const { view, send } = useRunChat(runId);
  const [chosen, setChosen] = useState<string | null>(null);
  const data = view.data;
  const target = data ? pickTarget(data.targets, chosen) : null;
  const selected = target ? targetKey(target) : null;
  const entries = data ? conversationEntries(data.messages, data.targets.length > 1 ? selected : null) : [];
  const list = useRef<HTMLOListElement>(null);
  const count = entries.length;
  useEffect(() => {
    const element = list.current;
    if (element && typeof element.scrollTo === "function") element.scrollTo({ top: element.scrollHeight });
  }, [count]);

  if (view.isLoading) return <Spinner />;
  if (view.error || !data) {
    return (
      <Callout tone="danger">
        <ErrorText error={view.error} />
      </Callout>
    );
  }
  return (
    <div className="lrc stack" data-testid="lrc">
      <div className="lrc-intro">
        <p className="muted small">
          {t("runChat.intro")} <DocLink to="ausfuehrungen#teamleitung" label={t("runChat.docs")} />
        </p>
      </div>
      {data.targets.length ? null : <p className="muted small">{t("runChat.noTargets")}</p>}
      {data.targets.length > 1 && selected ? (
        <TargetPicker targets={data.targets} selected={selected} onSelect={setChosen} />
      ) : null}
      {target ? <TargetActivity target={target} /> : null}
      <ol ref={list} className="lrc-messages" role="log" aria-live="polite" aria-label={t("runChat.messages")}>
        {entries.map((entry) => (
          <Entry key={entry.message.id} entry={entry} teams={target?.teams ?? []} />
        ))}
      </ol>
      {entries.length ? null : <p className="muted small">{t("runChat.empty")}</p>}
      <Composer view={data} target={target} send={send} />
    </div>
  );
}
