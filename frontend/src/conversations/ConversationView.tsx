// One conversation: its header (title, agent, model, offline, cost, export, delete), the message stream and the
// composer with files. An answer that is being written streams in live (the run's events); a tool call that waits
// for a person shows its approval card in the answer.

import { Button, ConfirmIconButton, IconButton } from "@nodestro/ui-core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Paperclip, Pencil, Send, Square, Trash2, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import {
  type AgentConversation,
  type AgentConversationChange,
  type AgentConversationFile,
  conversationKeys,
  conversationsApi,
  useAgentConversation,
} from "../api/conversations";
import { useTemplates } from "../api/hooks";
import { GrantedContentBadge, GrantedContentNotice } from "../components/GrantedContent";
import { toast } from "../components/toast";
import { Callout, Chip, Spinner, TextArea, TextInput, Toggle } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatBytes, formatCost } from "../lib/format";
import { useAnswerStream } from "./answerStream";
import { agentName } from "./ConversationsPage";
import { MessageItem } from "./MessageItem";

/** How often an open answer is read again (a pause at an approval, a run in a worker): the stream adds the text. */
export const ANSWERING_POLL_MS = 2500;

/** The files of the conversation that no message has sent yet (uploaded, waiting for the next message). */
export function unsentFiles(conversation: Pick<AgentConversation, "files" | "messages">): AgentConversationFile[] {
  const sent = new Set(conversation.messages.flatMap((message) => message.attachments.map((item) => item.file_id)));
  return conversation.files.filter((item) => !sent.has(item.id));
}

/** Enter sends, Shift+Enter (and Enter while composing an IME text) makes a new line. */
export function sendsOnEnter(event: Pick<KeyboardEvent, "key" | "shiftKey" | "nativeEvent">): boolean {
  return event.key === "Enter" && !event.shiftKey && !(event.nativeEvent as { isComposing?: boolean }).isComposing;
}

export function ConversationView({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const conversation = useAgentConversation(id);
  const data = conversation.data;
  // While an answer is open the conversation is read regularly (also when its stream cannot follow it).
  const answering = data?.answering ? data.messages.find((item) => item.id === data.answering) ?? null : null;
  const answeringId = answering?.id ?? null;
  const { refetch } = conversation;
  useEffect(() => {
    if (!answeringId) return;
    const timer = window.setInterval(() => void refetch(), ANSWERING_POLL_MS);
    return () => window.clearInterval(timer);
  }, [answeringId, refetch]);
  const live = useAnswerStream(id, answering);
  if (conversation.isLoading) return <Spinner />;
  if (conversation.error || !data)
    return (
      <Callout tone="danger">
        <ErrorText error={conversation.error ?? new Error("not found")} />
      </Callout>
    );
  const refresh = (next?: AgentConversation) => {
    if (next) queryClient.setQueryData(conversationKeys.one(id), next);
    else void queryClient.invalidateQueries({ queryKey: conversationKeys.one(id) });
    void queryClient.invalidateQueries({ queryKey: conversationKeys.list });
  };
  return (
    <section className="conversation" aria-label={data.title || t("conversations.untitled")} data-testid="conversation">
      <ConversationHeader conversation={data} onChanged={refresh} onDeleted={onDeleted} />
      <ol className="conversation__messages" role="log" aria-live="polite" aria-label={t("conversations.messagesLabel")} data-testid="conversation-messages">
        {data.messages.length ? null : <li className="muted small">{t("conversations.firstMessage")}</li>}
        {data.messages.map((message) => (
          <li key={message.id}>
            <MessageItem conversation={data} message={message} live={message.id === answering?.id ? live : null} />
          </li>
        ))}
      </ol>
      <Composer conversation={data} answeringId={answering?.id ?? null} onChanged={refresh} />
    </section>
  );
}

function ConversationHeader({
  conversation,
  onChanged,
  onDeleted,
}: {
  conversation: AgentConversation;
  onChanged: (next?: AgentConversation) => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const templates = useTemplates();
  const canEdit = useAccess().can("edit");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const change = useMutation({
    mutationFn: (body: AgentConversationChange) => conversationsApi.change(conversation.id, body),
    onSuccess: (next) => {
      setEditing(false);
      onChanged(next);
    },
    onError: toast.error,
  });
  const remove = useMutation({
    mutationFn: () => conversationsApi.remove(conversation.id),
    onSuccess: () => {
      toast.success(t("conversations.deleted"));
      onChanged();
      onDeleted();
    },
    onError: toast.error,
  });
  const cost = conversation.usage.estimated_cost_usd;
  // N-08: the conversation holds content of a granted source (never cleared once set).
  const marked = conversation.provenance === "granted_content";
  return (
    <header className="conversation__head">
      <div className="conversation__title">
        {editing ? (
          <form
            className="row-gap"
            onSubmit={(event) => {
              event.preventDefault();
              change.mutate({ title: title.trim() });
            }}
          >
            <TextInput
              autoFocus
              value={title}
              maxLength={120}
              aria-label={t("conversations.title")}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.stopPropagation();
                  setEditing(false);
                  setTitle(conversation.title);
                }
              }}
              data-testid="conversation-title-input"
            />
            <IconButton icon={<Check size={16} />} label={t("common.save")} type="submit" disabled={change.isPending} />
            <IconButton icon={<X size={16} />} label={t("common.cancel")} onClick={() => setEditing(false)} />
          </form>
        ) : (
          <>
            <h2 data-testid="conversation-title">{conversation.title || t("conversations.untitled")}</h2>
            {canEdit ? (
              <IconButton
                icon={<Pencil size={16} />}
                label={t("conversations.rename")}
                onClick={() => {
                  setTitle(conversation.title);
                  setEditing(true);
                }}
                data-testid="conversation-rename"
              />
            ) : null}
          </>
        )}
      </div>
      <div className="conversation__facts muted small">
        <span>
          {t("conversations.withAgent", {
            agent: agentName(templates.data, conversation.agent.template_id),
            version: conversation.agent.version,
          })}
        </span>
        <span>{t("conversations.withModel", { model: conversation.model })}</span>
        <span data-testid="conversation-cost">{t("conversations.cost", { cost: formatCost(cost) })}</span>
        {marked ? <GrantedContentBadge kind="conversation" /> : null}
      </div>
      {marked ? <GrantedContentNotice kind="conversation" /> : null}
      {conversation.workflow_tool_updates?.length ? (
        <Callout tone="info">
          <span data-testid="conversation-workflow-updates">
            {t("workflowTools.updates.intro")}{" "}
            {conversation.workflow_tool_updates
              .map((item) => t("workflowTools.updates.item", { name: item.name, version: item.version, latest: item.latest_version }))
              .join("; ")}
          </span>
        </Callout>
      ) : null}
      <div className="row-gap conversation__actions">
        <Toggle
          checked={conversation.offline}
          disabled={!canEdit || change.isPending}
          onChange={(offline) => change.mutate({ offline })}
          label={t("conversations.offline")}
          description={t("conversations.offlineHint")}
        />
        <a className="ui-button ui-button--ghost ui-button--sm" href={conversationsApi.exportUrl(conversation.id)} download data-testid="conversation-export">
          <Download size={15} aria-hidden />
          {t("conversations.export")}
        </a>
        {canEdit ? (
          <ConfirmIconButton
            icon={<Trash2 size={16} />}
            label={t("conversations.delete")}
            busy={remove.isPending}
            onConfirm={() => remove.mutate()}
            data-testid="conversation-delete"
          />
        ) : null}
      </div>
    </header>
  );
}

function Composer({
  conversation,
  answeringId,
  onChanged,
}: {
  conversation: AgentConversation;
  answeringId: string | null;
  onChanged: (next?: AgentConversation) => void;
}) {
  const { t } = useTranslation();
  const canRun = useAccess().can("run");
  const canEdit = useAccess().can("edit");
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState<string[]>([]);
  const [refused, setRefused] = useState<{ name: string; error: unknown }[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const waiting = useMemo(() => unsentFiles(conversation), [conversation]);
  const send = useMutation({
    mutationFn: () => conversationsApi.send(conversation.id, text.trim(), waiting.map((item) => item.id)),
    onSuccess: () => {
      setText("");
      setRefused([]);
      onChanged();
    },
  });
  const cancel = useMutation({
    mutationFn: (messageId: string) => conversationsApi.cancel(conversation.id, messageId),
    onSuccess: () => onChanged(),
    onError: toast.error,
  });
  const removeFile = useMutation({
    mutationFn: (fileId: string) => conversationsApi.removeFile(conversation.id, fileId),
    onSuccess: (next) => onChanged(next),
    onError: toast.error,
  });
  const upload = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      setUploading((current) => [...current, file.name]);
      try {
        const [result] = await conversationsApi.upload(conversation.id, file);
        if (result?.problem) setRefused((current) => [...current, { name: file.name, error: result.problem }]);
      } catch (error) {
        setRefused((current) => [...current, { name: file.name, error }]);
      } finally {
        setUploading((current) => current.filter((name) => name !== file.name));
      }
    }
    onChanged();
  };
  const busy = Boolean(answeringId) || send.isPending;
  const empty = !text.trim() && !waiting.length;
  if (!canRun) return <p className="muted small">{t("conversations.readOnly")}</p>;
  return (
    <form
      className="conversation__composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && !empty) send.mutate();
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (canEdit && event.dataTransfer.files.length) void upload(event.dataTransfer.files);
      }}
    >
      {waiting.length || uploading.length || refused.length ? (
        <div className="conversation__files" aria-label={t("conversations.filesToSend")} role="group">
          {waiting.map((item) => (
            <Chip key={item.id} onRemove={canEdit ? () => removeFile.mutate(item.id) : undefined}>
              <span data-testid="conversation-pending-file">
                {item.name} · {formatBytes(item.size)}
              </span>
            </Chip>
          ))}
          {uploading.map((name) => (
            <Chip key={`up-${name}`}>{t("conversations.uploading", { name })}</Chip>
          ))}
          {refused.map((item, index) => (
            <Callout key={`${item.name}-${index}`} tone="danger">
              <strong>{item.name}</strong>: <ErrorText error={item.error} compact />
            </Callout>
          ))}
        </div>
      ) : null}
      <TextArea
        rows={3}
        value={text}
        maxLength={20000}
        placeholder={t("conversations.placeholder")}
        aria-label={t("conversations.messageLabel")}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (sendsOnEnter(event)) {
            event.preventDefault();
            if (!busy && !empty) send.mutate();
          }
        }}
        data-testid="conversation-input"
      />
      {send.error ? (
        <Callout tone="danger">
          <ErrorText error={send.error} />
        </Callout>
      ) : null}
      <div className="row-gap conversation__composer-actions">
        {canEdit ? (
          <>
            <input
              ref={input}
              type="file"
              multiple
              hidden
              onChange={(event) => {
                if (event.target.files?.length) void upload(event.target.files);
                event.target.value = "";
              }}
              data-testid="conversation-file-input"
            />
            <Button icon={<Paperclip size={15} />} onClick={() => input.current?.click()} data-testid="conversation-attach">
              {t("conversations.attach")}
            </Button>
          </>
        ) : null}
        <span className="muted small">{t("conversations.enterHint")}</span>
        {answeringId ? (
          <Button variant="danger" icon={<Square size={15} />} busy={cancel.isPending} onClick={() => cancel.mutate(answeringId)} data-testid="conversation-stop">
            {t("conversations.stop")}
          </Button>
        ) : (
          <Button type="submit" variant="primary" icon={<Send size={15} />} busy={send.isPending} disabled={empty || busy} data-testid="conversation-send">
            {t("conversations.send")}
          </Button>
        )}
      </div>
    </form>
  );
}
