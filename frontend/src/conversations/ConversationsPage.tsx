// Conversations with own agents (N-04): pick an agent template, then list, start, rename and delete its
// conversations; the open conversation shows on the right. Shown only while the server serves conversations
// (``features`` of /api/meta); every request is still checked by the API, which shows each person only their own.

import { Button } from "@nodestro/ui-core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessagesSquare, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useAccess } from "../api/access";
import {
  type AgentConversationSummary,
  conversationKeys,
  conversationsApi,
  useAgentConversations,
  useConversationsEnabled,
} from "../api/conversations";
import { useMeta, useTemplates } from "../api/hooks";
import type { AgentTemplate } from "../api/types";
import { ModelPicker } from "../components/ModelPicker";
import { Callout, EmptyState, Field, Modal, PageHeader, Select, Spinner, TextInput, Toggle } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatCost, relativeTime } from "../lib/format";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ConversationView } from "./ConversationView";

/** The agent filter's value for "every agent". */
const ALL = "";

/** The name of an agent template, or its id while the templates load (or when it was deleted). */
export function agentName(templates: AgentTemplate[] | undefined, templateId: string): string {
  return templates?.find((item) => item.id === templateId)?.agent.name || templateId;
}

/** The conversations of one agent (all with ``ALL``), most recently changed first (as the API lists them). */
export function conversationsOf(items: AgentConversationSummary[], templateId: string): AgentConversationSummary[] {
  return templateId === ALL ? items : items.filter((item) => item.agent.template_id === templateId);
}

export function ConversationsPage() {
  const meta = useMeta();
  const enabled = useConversationsEnabled();
  if (meta.isLoading) return <Spinner />;
  // Switched off (the default) or an older server: the area does not exist.
  if (!enabled) return <NotFoundPage />;
  return <Conversations />;
}

function Conversations() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const agent = params.get("agent") ?? ALL;
  const templates = useTemplates();
  const conversations = useAgentConversations();
  const [creating, setCreating] = useState(false);
  const canStart = useAccess().can("edit");
  const shown = useMemo(() => conversationsOf(conversations.data ?? [], agent), [conversations.data, agent]);
  const pick = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set("agent", value);
    else next.delete("agent");
    setParams(next);
  };
  return (
    <div className="page">
      <PageHeader
        title={t("nav.conversations")}
        doc="agenten#gespraeche"
        description={t("conversations.description")}
        actions={
          canStart ? (
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => setCreating(true)} data-testid="conversation-new">
              {t("conversations.new")}
            </Button>
          ) : null
        }
      />
      <div className="page__body">
        <div className="master-detail conversations">
          <div className="stack-sm conversations__side">
            <Field label={t("conversations.agent")}>
              <Select
                value={agent}
                onChange={pick}
                options={[
                  { value: ALL, label: t("conversations.allAgents") },
                  ...(templates.data ?? []).map((item) => ({ value: item.id, label: item.agent.name || item.id })),
                ]}
                data-testid="conversation-agent-filter"
              />
            </Field>
            {conversations.isLoading ? <Spinner /> : null}
            {conversations.error ? (
              <Callout tone="danger">
                <ErrorText error={conversations.error} />
              </Callout>
            ) : null}
            {conversations.data && !shown.length ? <p className="muted small">{t("conversations.noneYet")}</p> : null}
            {shown.length ? (
              <ul className="list" aria-label={t("conversations.listLabel")} data-testid="conversation-list">
                {shown.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`list__item ${item.id === id ? "selected" : ""}`}
                      aria-current={item.id === id ? "page" : undefined}
                      onClick={() => navigate({ pathname: `/conversations/${encodeURIComponent(item.id)}`, search: params.toString() })}
                      data-testid="conversation-item"
                    >
                      <span className="list__title">{item.title || t("conversations.untitled")}</span>
                      <span className="list__text">
                        {agentName(templates.data, item.agent.template_id)} · {t("conversations.messages", { count: item.messages })}
                        {item.cost_usd != null ? ` · ${formatCost(item.cost_usd)}` : ""}
                      </span>
                      <span className="list__text muted small">{relativeTime(item.updated_at)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="conversations__main">
            {id ? (
              <ConversationView key={id} id={id} onDeleted={() => navigate({ pathname: "/conversations", search: params.toString() })} />
            ) : (
              <EmptyState icon={MessagesSquare} title={t("conversations.emptyTitle")}>
                {t("conversations.emptyText")}
              </EmptyState>
            )}
          </div>
        </div>
      </div>
      <NewConversationDialog
        open={creating}
        onClose={() => setCreating(false)}
        templates={templates.data ?? []}
        agent={agent}
        onCreated={(created) => {
          setCreating(false);
          navigate({ pathname: `/conversations/${encodeURIComponent(created)}`, search: params.toString() });
        }}
      />
    </div>
  );
}

/**
 * Start a conversation with an agent template. A cloud model is never chosen automatically: without "Choose a
 * model" the API takes the agent's or the default model only when it is a local model, otherwise it asks for one.
 */
function NewConversationDialog({
  open,
  onClose,
  templates,
  agent,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  templates: AgentTemplate[];
  agent: string;
  onCreated: (id: string) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [choose, setChoose] = useState(false);
  const [model, setModel] = useState("");
  const [offline, setOffline] = useState(false);
  const chosen = templateId || agent || templates[0]?.id || "";
  const template = templates.find((item) => item.id === chosen);
  const create = useMutation({
    mutationFn: () =>
      conversationsApi.create({
        agent: { template_id: chosen },
        model: choose && model ? model : null,
        title: title.trim(),
        offline,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list });
      queryClient.setQueryData(conversationKeys.one(created.id), created);
      setTitle("");
      setChoose(false);
      setModel("");
      setOffline(false);
      create.reset();
      onCreated(created.id);
    },
  });
  return (
    <Modal
      title={t("conversations.newTitle")}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            variant="primary"
            busy={create.isPending}
            disabled={!chosen || (choose && !model)}
            onClick={() => create.mutate()}
            data-testid="conversation-create"
          >
            {t("conversations.start")}
          </Button>
        </>
      }
    >
      <div className="stack" data-autofocus>
        {!templates.length ? <Callout tone="info">{t("conversations.noAgents")}</Callout> : null}
        <Field label={t("conversations.agent")}>
          <Select
            value={chosen}
            onChange={setTemplateId}
            options={templates.map((item) => ({ value: item.id, label: item.agent.name || item.id }))}
            data-testid="conversation-new-agent"
          />
        </Field>
        <Field label={t("conversations.title")} hint={t("conversations.titleHint")}>
          <TextInput value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Toggle
          checked={choose}
          onChange={(value) => {
            setChoose(value);
            if (value && !model) setModel(template?.agent.model ?? "");
          }}
          label={t("conversations.chooseModel")}
          description={t("conversations.chooseModelHint")}
        />
        {choose ? <ModelPicker value={model} onChange={setModel} label={t("conversations.model")} /> : null}
        <Toggle checked={offline} onChange={setOffline} label={t("conversations.offline")} description={t("conversations.offlineHint")} />
        {create.error ? (
          <Callout tone="danger">
            <ErrorText error={create.error} />
          </Callout>
        ) : null}
      </div>
    </Modal>
  );
}
