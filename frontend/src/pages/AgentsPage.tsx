import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Download, Plus, Save, Sparkles, Trash2, Undo2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useBlocker, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys, useOrganize, useTemplates } from "../api/hooks";
import type { AgentConfig, AgentImportResult, AgentTemplate } from "../api/types";
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
import { UnsavedChangesModal } from "../components/UnsavedChanges";
import { Button, Callout, ConfirmIconButton, EmptyState, Hint, IconButton, PageHeader, Spinner } from "../components/ui";
import { AgentForm } from "../editor/AgentInspector";
import { DesignAgentDialog } from "../editor/DesignAgentDialog";
import { defaultAgent } from "../lib/defaults";
import { ErrorText } from "../lib/errors";
import { changedText } from "../lib/format";
import { useModelName } from "../components/ModelPicker";
import { LibraryAgents } from "./agents/LibraryAgents";
import { OriginBadge, TemplateHistory } from "./agents/TemplateHistory";

/** The id of a template that is being written and not saved yet ("Empty template" saves only on Save, ED-22). */
const NEW = "__new__";

/** The agent library: reusable agent configurations that appear in the editor's palette. */
export function AgentsPage() {
  const { t } = useTranslation();
  const templates = useTemplates();
  const modelLabel = useModelName();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AgentConfig | null>(null);
  // The starting point of a new template; it exists only in this form until the first save.
  const [fresh, setFresh] = useState<AgentConfig | null>(null);
  const [designOpen, setDesignOpen] = useState(false);
  const organize = useOrganize();
  const [filter, setFilter] = useState<OrganizeFilterValue>(NO_FILTER);
  const shown = applyOrganize(templates.data ?? [], "template", (item) => item.id, filter, organize.data);
  // ?template=<id> (from the global search) opens that template.
  const [params, setParams] = useSearchParams();
  const wanted = params.get("template");
  const selected = templates.data?.find((item) => item.id === selectedId) ?? null;
  const isNew = selectedId === NEW && fresh !== null;
  const base = isNew ? fresh : selected?.agent ?? null;
  const dirty = Boolean(base && draft && JSON.stringify(base) !== JSON.stringify(draft));
  // Opening another template while this one has unsaved edits asks first (like leaving the workflow editor).
  // ``undefined``: nothing waits; ``null``: close the form.
  const [pendingId, setPendingId] = useState<string | null | undefined>(undefined);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const choose = (id: string | null) => {
    if (id !== selectedId && dirtyRef.current) setPendingId(id);
    else setSelectedId(id);
  };
  useEffect(() => {
    if (!wanted) return;
    choose(wanted);
    setFilter(NO_FILTER);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, setParams]);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    const onUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  // Templates are offered in their saved state; unsaved form changes are marked, never sent.
  const offer: ContextOffer | null = selected ? { kind: "agent", refId: selected.id, label: selected.agent.name, dirty } : null;
  useContextOffer("agents", offer);

  useEffect(() => {
    setDraft(base ? structuredClone(base) : null);
    // Only reset the draft when another template (or a new one) is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.updated_at]);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.templates }),
      queryClient.invalidateQueries({ queryKey: ["template-versions"] }),
    ]);

  const create = useMutation({
    mutationFn: api.createTemplate,
    onSuccess: (template: AgentTemplate) => {
      toast.success(t("agents.created", { name: template.agent.name }));
    },
    onError: toast.error,
  });
  // A new template from the design dialog opens right away (it is saved already).
  const createAndOpen = (agent: AgentConfig) =>
    create.mutate(agent, { onSuccess: (template) => void refresh().then(() => choose(template.id)) });
  const startNew = () => {
    if (selectedId === NEW) return;
    setFresh(defaultAgent({ name: t("agents.newTemplateName") }));
    choose(NEW);
  };
  const saveTemplate = useMutation({
    mutationFn: ({ id, agent }: { id: string; agent: AgentConfig }) => api.saveTemplate(id, agent),
    onSuccess: () => {
      void refresh();
      toast.success(t("common.saved"));
    },
    onError: toast.error,
  });
  // Saving a new template creates it; ``then`` runs after the save (e.g. the navigation that waited for it).
  const saveDraft = (then?: () => void) => {
    if (!draft) return;
    if (isNew)
      create.mutate(draft, {
        onSuccess: (template) => {
          dirtyRef.current = false;
          void refresh().then(() => (then ? then() : setSelectedId(template.id)));
        },
      });
    else if (selected) saveTemplate.mutate({ id: selected.id, agent: draft }, { onSuccess: () => then?.() });
  };
  const saving = saveTemplate.isPending || (isNew && create.isPending);
  // Export: the latest version as a file (no connections, knowledge files or approval rules, NAL-B1).
  const exportTemplate = useMutation({
    mutationFn: async (template: AgentTemplate) => {
      const document = await api.exportTemplate(template.id);
      const name = template.agent.name.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "") || "agent";
      const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], { type: "application/json" }));
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `${name}.nodestro-agent.json`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: toast.error,
  });
  // Import: the file is untrusted; the server resets approval rules and drops connections and knowledge files.
  const fileInput = useRef<HTMLInputElement>(null);
  const importTemplate = useMutation({
    mutationFn: async (file: File) => {
      let document: unknown;
      try {
        document = JSON.parse(await file.text());
      } catch {
        throw new Error(t("agentHistory.importNotJson"));
      }
      return api.importTemplate(document);
    },
    onSuccess: (result: AgentImportResult) => {
      const removed = result.removed.map((item) => t(`agentHistory.removed.${item}`)).join(", ");
      toast.success(
        removed
          ? t("agentHistory.importedRemoved", { name: result.template.agent.name, removed })
          : t("agentHistory.imported", { name: result.template.agent.name }),
      );
      if (result.check.issues.length) toast.info(t("agentHistory.importNeeds", { count: result.check.issues.length }));
      void refresh().then(() => choose(result.template.id));
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
              <input
                ref={fileInput}
                type="file"
                accept=".json,application/json"
                hidden
                data-testid="template-import-file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) importTemplate.mutate(file);
                }}
              />
              <Button icon={Upload} busy={importTemplate.isPending} onClick={() => fileInput.current?.click()}>
                {t("agentHistory.import")}
              </Button>
              <Button icon={Plus} onClick={startNew}>
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
          <LibraryAgents onCopied={(template) => void refresh().then(() => choose(template.id))} />
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
                    onClick={() => choose(template.id)}
                    aria-pressed={template.id === selectedId}
                  >
                    <div className="card__head">
                      <span className="card__avatar">
                        <Icon size={16} aria-hidden />
                      </span>
                      <div>
                        <h3>{template.agent.name}</h3>
                        <span className="muted small">
                          {modelLabel(template.agent.model)} ·{" "}
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
                      {changedText(t, template.updated_at)}
                    </span>
                    {template.meta && template.meta.origin !== "user" ? <OriginBadge template={template} /> : null}
                  </button>
                  <TagChips kind="template" id={template.id} />
                </article>
              );
            })}
          </div>
        </div>
      </div>
      <aside className="inspector" aria-label={t("agents.edit")}>
        {(selected || isNew) && draft ? (
          <>
            {isNew ? <p className="muted small inspector__note">{t("agents.newUnsaved")}</p> : null}
            <AgentForm
              key={isNew ? NEW : selected!.id}
              agent={draft}
              onChange={(patch) => setDraft({ ...draft, ...patch })}
              onReplace={setDraft}
              existing={templates.data?.map((item) => item.agent.name)}
              actions={
                <>
                  {selected ? (
                    <>
                      <DiscussIcon offer={offer} />
                      <FavoriteButton kind="template" id={selected.id} name={selected.agent.name} />
                      <TagEditor kind="template" id={selected.id} name={selected.agent.name} />
                      <IconButton
                        icon={Download}
                        label={t("agentHistory.export")}
                        disabled={exportTemplate.isPending}
                        onClick={() => exportTemplate.mutate(selected)}
                      />
                      <ConfirmIconButton icon={Trash2} label={t("agents.delete")} busy={remove.isPending} onConfirm={() => remove.mutate(selected.id)} />
                    </>
                  ) : null}
                </>
              }
            />
            {selected && !isNew ? <TemplateHistory template={selected} draft={draft} onRestore={setDraft} /> : null}
            <div className="inspector__footer">
              {isNew ? (
                <Button variant="ghost" icon={Undo2} onClick={() => setSelectedId(null)}>
                  {t("common.cancel")}
                </Button>
              ) : (
                <Button variant="ghost" icon={Undo2} disabled={!dirty} onClick={() => setDraft(structuredClone(base!))}>
                  {t("common.discard")}
                </Button>
              )}
              <Button variant="primary" icon={Save} disabled={!dirty && !isNew} busy={saving} onClick={() => saveDraft()}>
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
      <UnsavedChangesModal
        open={pendingId !== undefined || blocker.state === "blocked"}
        text={t("agents.unsavedText", { name: draft?.name ?? "" })}
        saving={saving}
        onStay={() => {
          setPendingId(undefined);
          blocker.reset?.();
        }}
        onDiscard={() => {
          if (base) setDraft(structuredClone(base));
          dirtyRef.current = false;
          if (pendingId !== undefined) setSelectedId(pendingId);
          setPendingId(undefined);
          blocker.proceed?.();
        }}
        onSave={() =>
          saveDraft(() => {
            dirtyRef.current = false;
            if (pendingId !== undefined) setSelectedId(pendingId);
            setPendingId(undefined);
            blocker.proceed?.();
          })
        }
      />
      <DesignAgentDialog
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        existing={templates.data?.map((item) => item.agent.name) ?? []}
        onApply={createAndOpen}
      />
    </div>
  );
}
