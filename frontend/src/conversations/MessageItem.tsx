// One message of a conversation. A person's message shows its text and the files sent with it (each a download, with
// how the model received it). An answer shows its text (live while it is written), its tool calls with arguments,
// result and duration, the approval card of a call that waits for a person, the web sources, the model and the cost.
// A workflow tool's call (N-20) also shows its workflow, fixed version, run and the cards its run waits for; the
// result files of workflow tools are the answer's attachments.

import { ChatMessage, ToolCallRow } from "@nodestro/ui-ai";
import { Bot, ExternalLink, FileText, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import {
  type AgentConversation,
  type ConversationMessage,
  FINAL_STATUSES,
  conversationsApi,
  type FileMode,
  type MessageStatus,
  type ToolCallView,
} from "../api/conversations";
import { AssistantMarkdown } from "../assistant/AssistantMarkdown";
import { Badge, Callout, Spinner } from "../components/ui";
import { ProblemText } from "../lib/errors";
import { formatBytes, formatCost, formatTokens } from "../lib/format";
import { type StudioTextMap, StudioTexts } from "../lib/uiTexts";
import { NodeToolApprovals, ToolCallApprovalNote } from "../runs/ToolApprovalCard";
import { WebSources } from "../runs/WebSources";
import { AnswerFiles, WorkflowCallPanel } from "../workflowTools/WorkflowCall";
import { AGENT_NODE, type LiveAnswer, type LiveCall } from "./answerStream";

/** The label key of how the model received a file (fixed keys, so every one is a known text). */
const MODE_KEYS = {
  text: "conversations.mode.text",
  document: "conversations.mode.document",
  image: "conversations.mode.image",
  ocr_text: "conversations.mode.ocrText",
  overview: "conversations.mode.overview",
  unavailable: "conversations.mode.unavailable",
} as const satisfies Record<FileMode, string>;

/** The label key of an answer that did not simply succeed (``null``: nothing to say). */
export function statusKey(status: MessageStatus) {
  switch (status) {
    case "queued":
      return "conversations.status.queued";
    case "running":
      return "conversations.status.running";
    case "paused":
      return "conversations.status.paused";
    case "failed":
      return "conversations.status.failed";
    case "cancelled":
      return "conversations.status.cancelled";
    default:
      return null;
  }
}

/** The tool calls to show: the stored ones, with the calls that arrived live and are not stored yet. */
export function shownCalls(stored: ToolCallView[], live: LiveCall[] | undefined): (ToolCallView | LiveCall)[] {
  const known = new Set(stored.map((call) => call.id));
  return [...stored, ...(live ?? []).filter((call) => !known.has(call.id))];
}

export function MessageItem({
  conversation,
  message,
  live,
}: {
  conversation: AgentConversation;
  message: ConversationMessage;
  live: LiveAnswer | null;
}) {
  const { t } = useTranslation();
  if (message.role === "user") {
    const present = new Set(conversation.files.map((item) => item.id));
    return (
      // The shared message (@nodestro/ui-ai, ST-068) in the studio's look: a bubble on the right, no author line.
      <ChatMessage role="user" hideHead className="chat-message chat-message--user" data-testid="conversation-message-user">
        {message.content ? <div className="chat-bubble">{message.content}</div> : null}
        {message.attachments.length ? (
          <ul className="conversation__attachments" aria-label={t("conversations.sentFiles")}>
            {message.attachments.map((item) => (
              <li key={item.file_id} className="chat-context__item">
                <FileText size={13} aria-hidden />
                {present.has(item.file_id) ? (
                  <a href={conversationsApi.fileUrl(conversation.id, item.file_id)} download={item.name} data-testid="conversation-file-link">
                    {item.name}
                  </a>
                ) : (
                  <span title={t("conversations.fileRemoved")}>{item.name}</span>
                )}
                <span className="muted small">{formatBytes(item.size)}</span>
                {item.mode ? <Badge tone={item.mode === "unavailable" ? "warning" : "idle"}>{t(MODE_KEYS[item.mode])}</Badge> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </ChatMessage>
    );
  }
  const final = FINAL_STATUSES.has(message.status);
  const text = !final && live && live.text.length > message.content.length ? live.text : message.content;
  const calls = shownCalls(message.tool_calls, final ? undefined : live?.calls);
  const usage = final ? message.usage : (live?.usage ?? message.usage);
  const cost = final ? message.cost_usd : (usage?.estimated_cost_usd ?? message.cost_usd);
  const finalNote = statusKey(message.status);
  const resultFiles = message.result_files ?? [];
  return (
    <ChatMessage
      role="assistant"
      hideHead
      className="chat-message"
      label={t("conversations.answer")}
      data-testid="conversation-message-answer"
      data-status={message.status}
      // Busy while it is written; the spinner below says so in the studio's words.
      status={final ? "complete" : "streaming"}
      statusLine={null}
      avatar={
        <span className="chat-avatar">
          <Bot size={14} />
        </span>
      }
    >
      {text ? <AssistantMarkdown text={text} /> : null}
      {!final && !text ? <Spinner label={t(statusKey(message.status) ?? "conversations.status.running")} /> : null}
      {calls.length ? (
        <ul className="conversation__calls" aria-label={t("conversations.toolCalls")}>
          {calls.map((call) => (
            <li key={call.id}>
              <AnswerToolCall call={call} />
              {"started_at" in call && call.workflow ? <WorkflowCallPanel call={call.workflow} final={final} attached={resultFiles.length > 0} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <AnswerFiles files={resultFiles} label={t("workflowTools.call.attachments")} testId="answer-result-files" />
      {!final && message.run_id ? <NodeToolApprovals runId={message.run_id} nodeId={AGENT_NODE} /> : null}
      {message.sources.length ? <WebSources run={{ sources: message.sources }} /> : null}
      {message.error ? (
        <Callout tone={message.status === "cancelled" ? "warning" : "danger"}>
          <ProblemText item={message.error} />
        </Callout>
      ) : null}
      <p className="muted small conversation__meta" data-testid="conversation-answer-meta">
        {final && finalNote ? (
          <>
            <Badge tone={message.status === "failed" ? "danger" : "warning"}>{t(finalNote)}</Badge>{" "}
          </>
        ) : null}
        {message.model ? <span>{message.model}</span> : null}
        {usage ? (
          <span>
            {" "}
            ·{" "}
            {t("conversations.tokens", {
              tokens: formatTokens(usage.total_tokens),
            })}
          </span>
        ) : null}
        <span data-testid="conversation-answer-cost"> · {t("conversations.cost", { cost: formatCost(cost) })}</span>
        {message.run_id ? (
          <>
            {" · "}
            <Link to={`/executions/${encodeURIComponent(message.run_id)}`}>
              {t("conversations.openRun")} <ExternalLink size={11} aria-hidden />
            </Link>
          </>
        ) : null}
      </p>
    </ChatMessage>
  );
}

/** The wording of an answer's tool calls in the shared ToolCallRow. */
export const ANSWER_TOOL_CALL_TEXTS: StudioTextMap = {
  "ai.toolCall.arguments": "conversations.toolArguments",
  "ai.toolCall.result": "conversations.toolResult",
};

function AnswerToolCall({ call }: { call: ToolCallView | LiveCall }) {
  const { t } = useTranslation();
  const stored = "started_at" in call ? call : null;
  const waiting = "started_at" in call ? call.approval?.status === "pending" : call.waiting;
  const done = "started_at" in call ? Boolean(call.finished_at) : call.finished;
  const state = waiting
    ? t("conversations.toolWaiting")
    : !done
      ? t("conversations.toolRunning")
      : stored?.duration_ms != null
        ? t("conversations.toolTook", { ms: stored.duration_ms })
        : t("conversations.toolDone");
  return (
    <StudioTexts texts={ANSWER_TOOL_CALL_TEXTS}>
      {/* The shared row (@nodestro/ui-ai, ST-068) as one disclosure, like the details it replaces. */}
      <ToolCallRow
        disclosure
        className="conversation__call"
        data-testid="conversation-tool-call"
        name={call.name}
        status={call.is_error ? "failed" : waiting ? "awaiting_approval" : !done ? "running" : "succeeded"}
        statusText={call.is_error ? t("conversations.toolFailed") : state}
        icon={<Wrench size={13} />}
        arguments={stored ? stored.arguments : call.arguments}
        result={call.result != null ? <pre className="code-block">{call.result}</pre> : undefined}
        note={stored?.approval ? <ToolCallApprovalNote approval={stored.approval} /> : undefined}
      />
    </StudioTexts>
  );
}
