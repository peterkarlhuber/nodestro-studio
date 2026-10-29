import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import {
  Check,
  History,
  KeyRound,
  Maximize2,
  Minimize2,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys, useSettings } from "../api/hooks";
import type { AttachRequest, Attachment, Conversation } from "../api/types";
import { providerList } from "../components/ModelPicker";
import { toast } from "../components/toast";
import { Button, Callout, DocLink, Hint, IconButton, Spinner, TextArea, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatCost, relativeTime } from "../lib/format";
import { missingProviders } from "../lib/providers";
import { AttachmentBar } from "./AttachmentBar";
import { AttachPicker } from "./AttachPicker";
import { MessageView } from "./MessageView";
import { draftFingerprint, useAssistant } from "./store";
import { useConversation } from "./useConversation";

const EXAMPLES = ["createWorkflow", "knowledgeMemory", "judge", "testAgent", "costs"] as const;

function ConversationList({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: keys.conversations, queryFn: api.conversations });
  const current = useAssistant((state) => state.conversationId);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: keys.conversations });
  const rename = async (id: string) => {
    try {
      const renamed = await api.renameConversation(id, title);
      queryClient.setQueryData(keys.conversation(id), renamed);
      setEditing(null);
      refresh();
    } catch (error) {
      toast.error(error);
    }
  };
  const remove = async (id: string) => {
    try {
      await api.deleteConversation(id);
      queryClient.removeQueries({ queryKey: keys.conversation(id) });
      if (current === id) useAssistant.getState().setConversation(null);
      useAssistant.getState().setView("list");
      setConfirm(null);
      refresh();
    } catch (error) {
      toast.error(error);
    }
  };
  if (list.isLoading) return <Spinner />;
  if (list.error)
    return (
      <Callout tone="danger">
        <ErrorText error={list.error} />
      </Callout>
    );
  if (!list.data?.length) return <p className="muted small chat-empty-list">{t("assistant.list.empty")}</p>;
  return (
    <ul className="chat-list" aria-label={t("assistant.list.title")}>
      {list.data.map((item) => (
        <li key={item.id} className={`chat-list__item ${item.id === current ? "selected" : ""}`} data-testid="chat-list-item">
          {editing === item.id ? (
            <form
              className="chat-list__rename"
              onSubmit={(event) => {
                event.preventDefault();
                void rename(item.id);
              }}
            >
              <TextInput value={title} onChange={(event) => setTitle(event.target.value)} aria-label={t("assistant.list.rename")} autoFocus maxLength={120} />
              <IconButton icon={Check} label={t("common.save")} type="submit" />
              <IconButton icon={X} label={t("common.cancel")} onClick={() => setEditing(null)} />
            </form>
          ) : (
            <>
              <button type="button" className="chat-list__open" onClick={() => onOpen(item.id)}>
                <strong>{item.title || t("assistant.untitled")}</strong>
                <span className="muted small">
                  {t("assistant.list.meta", { count: item.messages, time: relativeTime(item.updated_at), cost: formatCost(item.cost_usd) })}
                </span>
              </button>
              {confirm === item.id ? (
                <span className="chat-list__confirm">
                  <Button size="sm" variant="danger" onClick={() => void remove(item.id)} data-testid="chat-delete-confirm">
                    {t("common.delete")}
                  </Button>
                  <IconButton icon={X} label={t("common.cancel")} onClick={() => setConfirm(null)} />
                </span>
              ) : (
                <span className="chat-list__actions">
                  <IconButton
                    icon={Pencil}
                    label={t("assistant.list.rename")}
                    onClick={() => {
                      setEditing(item.id);
                      setTitle(item.title);
                    }}
                  />
                  <IconButton icon={Trash2} label={t("assistant.list.delete")} onClick={() => setConfirm(item.id)} data-testid="chat-delete" />
                </span>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function Welcome({ onExample }: { onExample: (text: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="chat-welcome">
      <div className="chat-welcome__icon" aria-hidden>
        <Sparkles size={20} />
      </div>
      <h3>{t("assistant.welcome.title")}</h3>
      <p className="muted small">{t("assistant.welcome.text")}</p>
      <div className="chat-examples">
        {EXAMPLES.map((id) => (
          <button key={id} type="button" className="chat-example" onClick={() => onExample(t(`assistant.welcome.examples.${id}`))}>
            {t(`assistant.welcome.examples.${id}`)}
          </button>
        ))}
      </div>
      <p className="muted small">{t("assistant.welcome.privacy")}</p>
    </div>
  );
}

function useEnsureConversation() {
  const queryClient = useQueryClient();
  return async (): Promise<string> => {
    const existing = useAssistant.getState().conversationId;
    if (existing) return existing;
    const created = await api.createConversation();
    queryClient.setQueryData(keys.conversation(created.id), created);
    useAssistant.getState().setConversation(created.id);
    void queryClient.invalidateQueries({ queryKey: keys.conversations });
    return created.id;
  };
}

function ChatView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const conversationId = useAssistant((state) => state.conversationId);
  const pending = useAssistant((state) => state.pending);
  const settings = useSettings();
  const conversation = useConversation(conversationId);
  const ensure = useEnsureConversation();
  const [text, setText] = useState("");
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const data = conversation.data;
  const streaming = data?.streaming ?? null;
  const history = data?.history ?? [];

  // A conversation that no longer exists (deleted elsewhere) starts a new one.
  useEffect(() => {
    if (conversation.error) useAssistant.getState().setConversation(null);
  }, [conversation.error]);

  // Follow the answer while it grows.
  const lastLength = history.length ? history[history.length - 1].content.length : 0;
  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [history.length, lastLength]);

  const store = (updated: Conversation) => {
    queryClient.setQueryData(keys.conversation(updated.id), updated);
    void queryClient.invalidateQueries({ queryKey: keys.conversations });
  };

  const attach = async (request: AttachRequest): Promise<boolean> => {
    setBusy(true);
    try {
      const id = await ensure();
      const updated = await api.attach(id, request);
      store(updated);
      if (request.variant === "draft" && request.workflow) {
        const attachment = updated.attachment_states.find((item) => item.kind === request.kind && item.ref_id === request.ref_id);
        if (attachment) useAssistant.getState().rememberDraft(attachment.id, draftFingerprint(request.workflow));
      }
      return true;
    } catch (error) {
      toast.error(error);
      return false;
    } finally {
      setBusy(false);
    }
  };

  // "Discuss with assistant" in a view: attach the chosen object right away.
  useEffect(() => {
    if (!pending) return;
    useAssistant.getState().clearPending();
    void attach(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const refresh = async (attachment: Attachment, draft: boolean) => {
    if (!data) return;
    const offer = Object.values(useAssistant.getState().offers).find(
      (item) => item.kind === attachment.kind && item.refId === attachment.ref_id && item.draft,
    );
    const workflow = draft && offer?.draft ? offer.draft() : null;
    try {
      const updated = await api.refreshAttachment(data.id, attachment.id, workflow);
      store(updated);
      if (workflow) useAssistant.getState().rememberDraft(attachment.id, draftFingerprint(workflow));
      toast.success(t("assistant.attachments.refreshed"));
    } catch (error) {
      toast.error(error);
    }
  };

  const detach = async (attachment: Attachment) => {
    if (!data) return;
    try {
      store(await api.detach(data.id, attachment.id));
    } catch (error) {
      toast.error(error);
    }
  };

  const send = useMutation({
    mutationFn: async (content: string) => {
      const id = await ensure();
      return { id, sent: await api.sendMessage(id, content) };
    },
    onSuccess: ({ id, sent }) => {
      setText("");
      queryClient.setQueryData<Conversation>(keys.conversation(id), (current) =>
        current ? { ...current, history: [...current.history, sent.user, sent.assistant], streaming: sent.assistant.id } : current,
      );
      void queryClient.invalidateQueries({ queryKey: keys.conversation(id) });
      void queryClient.invalidateQueries({ queryKey: keys.conversations });
    },
    onError: (error) => toast.error(error),
  });

  const submit = () => {
    const content = text.trim();
    if (!content || streaming || send.isPending) return;
    send.mutate(content);
  };

  const cancel = async () => {
    if (!data || !streaming) return;
    try {
      await api.cancelMessage(data.id, streaming);
    } catch (error) {
      toast.error(error);
    }
    void queryClient.invalidateQueries({ queryKey: keys.conversation(data.id) });
  };

  const retry = async (messageId: string) => {
    if (!data) return;
    try {
      await api.retryMessage(data.id, messageId);
      void queryClient.invalidateQueries({ queryKey: keys.conversation(data.id) });
    } catch (error) {
      toast.error(error);
    }
  };

  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const missing = missingProviders(settings.data, [settings.data?.assistant_model]);
  const missingKey = missing.length > 0;
  const lastAssistant = [...history].reverse().find((message) => message.role === "assistant");
  return (
    <>
      <div className="chat-scroll" ref={scroller} aria-live="polite">
        {conversation.isLoading && conversationId ? <Spinner /> : null}
        {!history.length ? (
          <Welcome
            onExample={(example) => {
              setText(example);
              input.current?.focus();
            }}
          />
        ) : null}
        {history.map((message) => (
          <MessageView
            key={message.id}
            message={message}
            conversationId={data!.id}
            canRetry={message.id === lastAssistant?.id && message === history[history.length - 1] && !streaming}
            onRetry={() => void retry(message.id)}
          />
        ))}
      </div>
      <div className="chat-composer">
        {missingKey ? (
          <Callout tone="warning">
            <KeyRound size={12} aria-hidden /> {t("assistant.noProvider", { provider: providerList(t, missing) })} <Link to="/settings">{t("assistant.openSettings")}</Link>
          </Callout>
        ) : null}
        <AttachmentBar conversation={data} busy={busy} onAttach={(request) => void attach(request)} onRefresh={(item, draft) => void refresh(item, draft)} onDetach={(item) => void detach(item)} />
        <div className="chat-input">
          <TextArea
            ref={input}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKey}
            placeholder={t("assistant.composer.placeholder")}
            aria-label={t("assistant.composer.label")}
            rows={2}
            maxLength={12000}
            data-testid="assistant-input"
          />
          <div className="chat-input__actions">
            <Hint id="assistant.attach">
              <IconButton icon={Paperclip} label={t("assistant.composer.attach")} onClick={() => setPicker(true)} data-testid="assistant-attach" />
            </Hint>
            {streaming ? (
              <Button size="sm" icon={Square} onClick={() => void cancel()} data-testid="assistant-stop">
                {t("assistant.composer.stop")}
              </Button>
            ) : (
              <Button size="sm" variant="primary" icon={Send} busy={send.isPending} disabled={!text.trim()} onClick={submit} data-testid="assistant-send">
                {t("assistant.composer.send")}
              </Button>
            )}
          </div>
        </div>
        <p className="muted small chat-hint">{t("assistant.composer.hint")}</p>
      </div>
      <AttachPicker open={picker} onClose={() => setPicker(false)} onAttach={attach} />
    </>
  );
}

/** The global, collapsible chat panel on the right; the conversation survives navigation. */
export function AssistantPanel() {
  const { t } = useTranslation();
  const wide = useAssistant((state) => state.wide);
  const view = useAssistant((state) => state.view);
  const conversationId = useAssistant((state) => state.conversationId);
  const conversation = useConversation(conversationId);
  const close = () => useAssistant.getState().setOpen(false);
  const title = conversation.data?.title || t("assistant.title");
  const cost = conversation.data?.usage.estimated_cost_usd;
  return (
    <aside className="assistant-panel" aria-label={t("assistant.title")} data-testid="assistant-panel">
      <header className="assistant-panel__head">
        <div className="assistant-panel__title">
          <Sparkles size={15} aria-hidden />
          <div>
            <h2 title={title}>{view === "list" ? t("assistant.list.title") : title}</h2>
            {view === "chat" && conversation.data?.usage.requests ? (
              <Hint id="assistant.cost">
                <span className="muted small" tabIndex={0} data-testid="assistant-chat-cost">
                  {t("assistant.chatCost", { cost: formatCost(cost) })}
                </span>
              </Hint>
            ) : null}
          </div>
        </div>
        <div className="assistant-panel__actions">
          <DocLink to="assistent" label={t("assistant.docs")} />
          <Hint id="assistant.history">
            <IconButton
              icon={History}
              label={t("assistant.list.title")}
              onClick={() => useAssistant.getState().setView(view === "list" ? "chat" : "list")}
              data-testid="assistant-history"
            />
          </Hint>
          <IconButton icon={Plus} label={t("assistant.newChat")} onClick={() => useAssistant.getState().setConversation(null)} data-testid="assistant-new" />
          <IconButton
            icon={wide ? Minimize2 : Maximize2}
            label={wide ? t("assistant.narrow") : t("assistant.wide")}
            onClick={() => useAssistant.getState().setWide(!wide)}
            className="assistant-panel__wide"
          />
          <IconButton icon={X} label={t("assistant.close")} onClick={close} data-testid="assistant-close" />
        </div>
      </header>
      {view === "list" ? (
        <div className="chat-scroll">
          <ConversationList onOpen={(id) => useAssistant.getState().setConversation(id)} />
        </div>
      ) : (
        <ChatView />
      )}
    </aside>
  );
}
