import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, Save, Sparkles, Trash2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys, useOrganize, useTemplates } from "../api/hooks";
import type { AgentConfig, AgentTemplate } from "../api/types";
import { DiscussIcon } from "../assistant/DiscussButton";
import type { ContextOffer } from "../assistant/store";
import { useContextOffer } from "../assistant/useContextOffer";
import { agentIcon } from "../components/icons";
import {
  FavoriteButton,
  NO_FILTER,
  OrganizeFilter,
  type OrganizeFilterValue,
  TagChips,
  TagEditor,
  applyOrganize,
} from "../components/Organize";
import { toast } from "../components/toast";
import { Button, Callout, ConfirmIconButton, EmptyState, Hint, PageHeader, Spinner } from "../components/ui";
import { AgentForm } from "../editor/AgentInspector";
import { DesignAgentDialog } from "../editor/DesignAgentDialog";
import { defaultAgent } from "../lib/defaults";
import { ErrorText } from "../lib/errors";
import { relativeTime } from "../lib/format";

/** The agent library: reusable agent configurations that appear in the editor's palette. */
export function AgentsPage() {
  const { t } = useTranslation();
  const templates = useTemplates();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AgentConfig | null>(null);
  const [designOpen, setDesignOpen] = useState(false);
  const organize = useOrganize();
  const [filter, setFilter] = useState<OrganizeFilterValue>(NO_FILTER);
  const shown = applyOrganize(templates.data ?? [], "template", (item) => item.id, filter, organize.data);
  // ?template=<id> (from the global search) opens that template.
  const [params, setParams] = useSearchParams();
  const wanted = params.get("template");
  useEffect(() => {
    if (!wanted) return;
    setSelectedId(wanted);
    setFilter(NO_FILTER);
    setParams({}, { replace: true });
  }, [wanted, setParams]);
  const selected = templates.data?.find((item) => item.id === selectedId) ?? null;
  const dirty = Boolean(selected && draft && JSON.stringify(selected.agent) !== JSON.stringify(draft));

  // Templates are offered in their saved state; unsaved form changes are marked, never sent.
  const offer: ContextOffer | null = selected ? { kind: "agent", refId: selected.id, label: selected.agent.name, dirty } : null;
  useContextOffer("agents", offer);

  useEffect(() => {
    setDraft(selected ? structuredClone(selected.agent) : null);
    // Only reset the draft when another template is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.updated_at]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.templates });

  const create = useMutation({
    mutationFn: api.createTemplate,
    onSuccess: (template: AgentTemplate) => {
      void refresh().then(() => setSelectedId(template.id));
      toast.success(t("agents.created", { name: template.agent.name }));
    },
    onError: toast.error,
  });
  const save = useMutation({
    mutationFn: ({ id, agent }: { id: string; agent: AgentConfig }) => api.saveTemplate(id, agent),
    onSuccess: () => {
      void refresh();
      toast.success(t("common.saved"));
    },
    onError: toast.error,
  });
  const remove = useMutation({
    mutationFn: api.deleteTemplate,
    onSuccess: () => {
      setSelectedId(null);
      void refresh();
      toast.success(t("agents.deleted"));
    },
    onError: toast.error,
  });

  return (
    <div className="page page--split">
      <div className="page__main">
        <PageHeader
          title={t("agents.title")}
          doc="agenten#bibliothek"
          description={t("agents.description")}
          actions={
            <>
              <Button icon={Plus} onClick={() => create.mutate(defaultAgent({ name: t("agents.newTemplateName") }))}>
                {t("agents.emptyTemplate")}
              </Button>
              <Hint id="agent.design">
                <Button variant="primary" icon={Sparkles} onClick={() => setDesignOpen(true)}>
                  {t("agents.describe")}
                </Button>
              </Hint>
            </>
          }
        />
        <div className="page__body">
          {templates.isLoading ? <Spinner /> : null}
          {templates.error ? (
            <Callout tone="danger">
              <ErrorText error={templates.error} />
            </Callout>
          ) : null}
          {templates.data && !templates.data.length ? (
            <EmptyState
              icon={Bot}
              title={t("agents.emptyTitle")}
              action={
                <Button variant="primary" icon={Sparkles} onClick={() => setDesignOpen(true)}>
                  {t("agents.describe")}
                </Button>
              }
            >
              {t("agents.emptyText")}
            </EmptyState>
          ) : null}
          {templates.data?.length ? (
            <div className="page__filters">
              <OrganizeFilter kind="template" value={filter} onChange={setFilter} />
            </div>
          ) : null}
          {templates.data?.length && !shown.length ? <p className="muted">{t("organize.noMatch")}</p> : null}
          <div className="card-grid">
            {shown.map((template) => {
              const Icon = agentIcon(template.agent.icon);
              return (
                <article
                  key={template.id}
                  className={`card card--organized ${template.id === selectedId ? "card--selected" : ""}`}
                >
                  <div className="card__corner">
                    <FavoriteButton kind="template" id={template.id} name={template.agent.name} />
                  </div>
                  <button
                    type="button"
                    className="card__main card--button"
                    onClick={() => setSelectedId(template.id)}
                    aria-pressed={template.id === selectedId}
                  >
                    <div className="card__head">
                      <span className="card__avatar">
                        <Icon size={16} aria-hidden />
                      </span>
                      <div>
                        <h3>{template.agent.name}</h3>
                        <span className="muted small">
                          {template.agent.model} ·{" "}
                          {t("agents.toolCount", {
                            count: template.agent.tools.length + template.agent.server_tools.length,
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="card__text">
                      {template.agent.description || <span className="muted">{t("common.noDescription")}</span>}
                    </p>
                    <span className="muted small">
                      {t("common.changed", {
                        time: relativeTime(template.updated_at),
                      })}
                    </span>
                  </button>
                  <TagChips kind="template" id={template.id} />
                </article>
              );
            })}
          </div>
        </div>
      </div>
      <aside className="inspector" aria-label={t("agents.edit")}>
        {selected && draft ? (
          <>
            <AgentForm
              key={selected.id}
              agent={draft}
              onChange={(patch) => setDraft({ ...draft, ...patch })}
              onReplace={setDraft}
              existing={templates.data?.map((item) => item.agent.name)}
              actions={
                <>
                  <DiscussIcon offer={offer} />
                  <FavoriteButton kind="template" id={selected.id} name={selected.agent.name} />
                  <TagEditor kind="template" id={selected.id} name={selected.agent.name} />
                  <ConfirmIconButton icon={Trash2} label={t("agents.delete")} busy={remove.isPending} onConfirm={() => remove.mutate(selected.id)} />
                </>
              }
            />
            <div className="inspector__footer">
              <Button variant="ghost" icon={Undo2} disabled={!dirty} onClick={() => setDraft(structuredClone(selected.agent))}>
                {t("common.discard")}
              </Button>
              <Button
                variant="primary"
                icon={Save}
                disabled={!dirty}
                busy={save.isPending}
                onClick={() => save.mutate({ id: selected.id, agent: draft })}
              >
                {t("common.save")}
              </Button>
            </div>
          </>
        ) : (
          <div className="inspector__content">
            <h2 className="inspector__heading">{t("agents.edit")}</h2>
            <p className="muted small">{t("agents.selectHint")}</p>
          </div>
        )}
      </aside>
      <DesignAgentDialog
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        existing={templates.data?.map((item) => item.agent.name) ?? []}
        onApply={(config) => create.mutate(config)}
      />
    </div>
  );
}
