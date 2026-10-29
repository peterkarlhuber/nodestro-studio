import {
  ArrowUpRight,
  BookOpen,
  Bot,
  Brain,
  Command,
  Diamond,
  FileSearch,
  Loader2,
  type LucideIcon,
  PencilRuler,
  RotateCcw,
  Rows3,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import type { AssistantStep, AttachmentKind, ChatMessage, ContextRef, Handover } from "../api/types";
import { Button, Callout, Hint } from "../components/ui";
import { ProblemText } from "../lib/errors";
import { formatCost, formatTokens } from "../lib/format";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { handoverPath } from "./handover";
import { SnapshotDialog } from "./SnapshotDialog";
import { useAssistant } from "./store";

export const KIND_ICON: Record<AttachmentKind, LucideIcon> = {
  workflow: Diamond,
  agent: Bot,
  tool: Command,
  memory: Brain,
  knowledge: BookOpen,
  run: Rows3,
};

/** What the assistant is doing right now, from its latest real step. */
export function StepLine({ step }: { step: AssistantStep | undefined }) {
  const { t } = useTranslation();
  const kind = step?.kind ?? "generate";
  return (
    <p className="chat-status" role="status" data-testid="assistant-status">
      <Loader2 size={13} className="spin" aria-hidden /> {t(`assistant.steps.${kind}`, { detail: step?.detail ?? "" })}
    </p>
  );
}

function ContextChips({ context, conversationId }: { context: ContextRef[]; conversationId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<ContextRef | null>(null);
  if (!context.length) return null;
  return (
    <div className="chat-context" aria-label={t("assistant.message.sentWith")}>
      <span className="muted small">{t("assistant.message.sentWith")}</span>
      {context.map((ref) => {
        const Icon = KIND_ICON[ref.kind];
        return (
          <button
            type="button"
            key={ref.snapshot_id}
            className="chat-context__item"
            onClick={() => setOpen(ref)}
            title={t("assistant.message.showSent")}
          >
            <Icon size={11} aria-hidden /> {ref.label}
            {ref.version && ref.variant === "saved" ? <span className="muted"> {ref.version}</span> : null}
            {ref.variant === "draft" ? <span className="chat-tag">{t("assistant.attachments.draftTag")}</span> : null}
            {ref.partial ? <span className="chat-tag chat-tag--warning">{t("assistant.attachments.partialTag")}</span> : null}
          </button>
        );
      })}
      {open ? (
        <SnapshotDialog conversationId={conversationId} snapshotId={open.snapshot_id} onClose={() => setOpen(null)} />
      ) : null}
    </div>
  );
}

const HANDOVER_ICON: Record<Handover["target"], LucideIcon> = {
  workflow_architect: Sparkles,
  agent_designer: PencilRuler,
  tool_builder: Wrench,
};

function HandoverCard({ handover }: { handover: Handover }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const Icon = HANDOVER_ICON[handover.target];
  const target = handover.target === "workflow_architect" ? `workflow_architect_${handover.mode ?? "create"}` : handover.target;
  return (
    <div className="handover-card" data-testid="handover-card">
      <div className="handover-card__head">
        <Icon size={15} aria-hidden />
        <strong>{t(`assistant.handover.${target}.title`, { name: handover.workflow_name ?? "" })}</strong>
      </div>
      <p className="small handover-card__text">{handover.instruction}</p>
      <p className="muted small">{t("assistant.handover.note")}</p>
      <Hint id="assistant.handover">
        <Button
          size="sm"
          variant="primary"
          icon={ArrowUpRight}
          onClick={() => {
            useAssistant.getState().startHandover(handover);
            navigate(handoverPath(handover));
          }}
        >
          {t(`assistant.handover.${target}.open`)}
        </Button>
      </Hint>
    </div>
  );
}

function UsageLine({ message }: { message: ChatMessage }) {
  const { t } = useTranslation();
  if (!message.usage) return null;
  return (
    <Hint id="assistant.cost">
      <span className="chat-usage" tabIndex={0}>
        {t("assistant.message.usage", {
          tokens: formatTokens(message.usage.total_tokens),
          cost: formatCost(message.usage.estimated_cost_usd),
        })}
        {message.estimated ? ` · ${t("assistant.message.estimated")}` : ""}
      </span>
    </Hint>
  );
}

function Steps({ steps }: { steps: AssistantStep[] }) {
  const { t } = useTranslation();
  const shown = steps.filter((step) => step.kind !== "generate");
  if (!shown.length) return null;
  return (
    <details className="chat-steps">
      <summary>{t("assistant.message.steps", { count: shown.length })}</summary>
      <ul>
        {shown.map((step, index) => (
          <li key={index}>{t(`assistant.done.${step.kind}`, { detail: step.detail })}</li>
        ))}
      </ul>
    </details>
  );
}

export function MessageView({
  message,
  conversationId,
  canRetry,
  onRetry,
}: {
  message: ChatMessage;
  conversationId: string;
  canRetry: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  if (message.role === "user") {
    return (
      <div className="chat-message chat-message--user" data-testid="chat-user">
        <div className="chat-bubble">{message.content}</div>
        <ContextChips context={message.context} conversationId={conversationId} />
      </div>
    );
  }
  const streaming = message.status === "streaming";
  return (
    <div className="chat-message chat-message--assistant" data-testid="chat-assistant" data-status={message.status}>
      <div className="chat-avatar" aria-hidden>
        <Sparkles size={13} />
      </div>
      <div className="chat-answer">
        {message.content ? <AssistantMarkdown text={message.content} /> : null}
        {streaming ? <StepLine step={message.steps[message.steps.length - 1]} /> : null}
        {message.sources.length ? (
          <div className="chat-sources">
            <span className="muted small">
              <FileSearch size={12} aria-hidden /> {t("assistant.message.sources")}
            </span>
            {message.sources.map((source) => (
              <Link key={source.ref} to={source.link} className="chat-source" data-testid="chat-source">
                {source.chapter_title} · {source.title}
              </Link>
            ))}
          </div>
        ) : null}
        {message.handovers.map((handover) => (
          <HandoverCard key={handover.id} handover={handover} />
        ))}
        {message.status === "failed" && message.error ? (
          <Callout tone="danger">
            <ProblemText item={message.error} />
            {message.error.code === "api_key_missing" || message.error.code === "provider.not_configured" || message.error.code === "assistant.auth_failed" ? (
              <>
                {" "}
                <Link to="/settings">{t("assistant.openSettings")}</Link>
              </>
            ) : null}
          </Callout>
        ) : null}
        {message.status === "cancelled" ? <p className="muted small">{t("assistant.message.cancelled")}</p> : null}
        {!streaming ? (
          <div className="chat-meta">
            <UsageLine message={message} />
            {canRetry && (message.status === "failed" || message.status === "cancelled") ? (
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={onRetry} data-testid="chat-retry">
                {t("assistant.message.retry")}
              </Button>
            ) : null}
          </div>
        ) : null}
        {!streaming ? <Steps steps={message.steps} /> : null}
      </div>
    </div>
  );
}
