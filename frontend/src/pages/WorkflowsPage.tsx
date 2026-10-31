import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Diamond, FilePlus2, FileUp, Plus, Sparkles, Trash2 } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { keys, useOrganize, useWorkflows } from "../api/hooks";
import { ArchitectDialog, ArchitectOptions, type ArchitectStart } from "../architect/ArchitectDialog";
import { useTakeHandover } from "../assistant/handover";
import type { WorkflowIn, WorkflowSummary } from "../api/types";
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
import { ExampleGallery } from "../library/ExampleGallery";
import {
  Button,
  Callout,
  EmptyState,
  Field,
  Hint,
  IconButton,
  Modal,
  PageHeader,
  Segmented,
  Spinner,
  StatusBadge,
  TextArea,
  TextInput,
} from "../components/ui";
import { newNode } from "../lib/defaults";
import { ErrorText, LocalError } from "../lib/errors";
import { relativeTime } from "../lib/format";
import { StartChoices } from "./StartChoices";

function starterGraph(): Pick<WorkflowIn, "nodes" | "edges"> {
  const start = newNode("start", { x: 0, y: 60 });
  const agent = newNode("agent", { x: 320, y: 0 });
  const output = newNode("output", { x: 680, y: 60 });
  return {
    nodes: [start, agent, output],
    edges: [
      { id: `edge_${start.id}`, source: start.id, target: agent.id },
      { id: `edge_${agent.id}`, source: agent.id, target: output.id },
    ],
  };
}

export function WorkflowsPage() {
  const { t } = useTranslation();
  const workflows = useWorkflows();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createMode, setCreateMode] = useState<"manual" | "ai">("manual");
  const [generateTools, setGenerateTools] = useState(true);
  const [architect, setArchitect] = useState<ArchitectStart | null>(null);
  // A new workflow proposed in the assistant opens the architect, filled in; the user starts it.
  useTakeHandover(
    (handover) => handover.target === "workflow_architect" && handover.mode === "create",
    (handover) => setArchitect({ mode: "create", description: handover.instruction }),
  );
  const [deleting, setDeleting] = useState<WorkflowSummary | null>(null);
  const organize = useOrganize();
  const [filter, setFilter] = useState<OrganizeFilterValue>(NO_FILTER);
  const shown = applyOrganize(workflows.data ?? [], "workflow", (item) => item.id, filter, organize.data);

  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.workflows });

  /** Opens the new-workflow dialog with the way to start the user picked. */
  const openCreate = (mode: "manual" | "ai") => {
    setCreateMode(mode);
    setCreateOpen(true);
  };

  /** "Create with AI": the description goes to the Workflow Architect, which starts at once. */
  const createWithAi = () => {
    if (!description.trim()) return;
    setCreateOpen(false);
    setArchitect({ mode: "create", description, name, generateTools, autoStart: true });
  };

  const submit = () => (createMode === "ai" ? createWithAi() : create.mutate());

  const create = useMutation({
    mutationFn: () => api.createWorkflow({ name: name.trim() || t("workflows.newName"), description, ...starterGraph() }),
    onSuccess: (workflow) => {
      void refresh();
      navigate(`/workflows/${workflow.id}`);
    },
    onError: toast.error,
  });

  const duplicate = useMutation({
    mutationFn: api.duplicateWorkflow,
    onSuccess: (workflow) => {
      void refresh();
      toast.success(t("workflows.created", { name: workflow.name }));
    },
    onError: toast.error,
  });

  const remove = useMutation({
    mutationFn: api.deleteWorkflow,
    onSuccess: () => {
      void refresh();
      setDeleting(null);
      toast.success(t("workflows.deleted"));
    },
    onError: toast.error,
  });

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as WorkflowIn;
      const workflow = await api.importWorkflow(data);
      void refresh();
      toast.success(t("workflows.imported", { name: workflow.name }));
      navigate(`/workflows/${workflow.id}`);
    } catch (error) {
      toast.error(error instanceof SyntaxError ? new LocalError("file.not_json") : error);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={t("workflows.title")}
        doc="workflows"
        description={t("workflows.description")}
        actions={
          <>
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
            <Hint id="workflow.import">
              <Button icon={FileUp} onClick={() => fileInput.current?.click()}>
                {t("common.import")}
              </Button>
            </Hint>
            <Button variant="primary" icon={Plus} onClick={() => setCreateOpen(true)}>
              {t("workflows.new")}
            </Button>
          </>
        }
      />
      <div className="page__body">
        {workflows.isLoading ? <Spinner /> : null}
        {workflows.error ? (
          <Callout tone="danger">
            <ErrorText error={workflows.error} />
          </Callout>
        ) : null}
        {workflows.data && !workflows.data.length ? (
          <EmptyState
            icon={Diamond}
            title={t("workflows.emptyTitle")}
            action={<StartChoices variant="full" onAi={() => openCreate("ai")} onManual={() => openCreate("manual")} />}
          >
            {t("workflows.emptyText")}
          </EmptyState>
        ) : null}
        {workflows.data?.length ? (
          <StartChoices variant="compact" onAi={() => openCreate("ai")} onManual={() => openCreate("manual")} />
        ) : null}
        {workflows.data?.length ? (
          <div className="page__filters">
            <OrganizeFilter kind="workflow" value={filter} onChange={setFilter} />
          </div>
        ) : null}
        {workflows.data?.length && !shown.length ? <p className="muted">{t("organize.noMatch")}</p> : null}
        <div className="card-grid">
          {shown.map((workflow) => (
            <article key={workflow.id} className="card card--link">
              <Link to={`/workflows/${workflow.id}`} className="card__main">
                <div className="card__head">
                  <span className="card__avatar">
                    <Diamond size={16} aria-hidden />
                  </span>
                  <div>
                    <h3>{workflow.name}</h3>
                    <span className="muted small">
                      {t("workflows.agentCount", { count: workflow.agents })} ·{" "}
                      {t("common.changed", { time: relativeTime(workflow.updated_at) })}
                    </span>
                  </div>
                </div>
                <p className="card__text">{workflow.description || <span className="muted">{t("common.noDescription")}</span>}</p>
              </Link>
              <TagChips kind="workflow" id={workflow.id} />
              <footer className="card__foot">
                {workflow.last_run_status ? (
                  <StatusBadge status={workflow.last_run_status} />
                ) : (
                  <span className="muted small">{t("workflows.neverRun")}</span>
                )}
                <div className="row-gap">
                  <FavoriteButton kind="workflow" id={workflow.id} name={workflow.name} />
                  <TagEditor kind="workflow" id={workflow.id} name={workflow.name} />
                  <IconButton icon={Copy} label={t("workflows.duplicate")} onClick={() => duplicate.mutate(workflow.id)} />
                  <IconButton icon={Trash2} label={t("common.delete")} onClick={() => setDeleting(workflow)} />
                </div>
              </footer>
            </article>
          ))}
        </div>
        <ExampleGallery />
      </div>

      <Modal
        title={t("workflows.new")}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            {createMode === "ai" ? (
              <Button variant="primary" icon={Sparkles} disabled={!description.trim()} onClick={createWithAi}>
                {t("workflows.createWithAi")}
              </Button>
            ) : (
              <Button variant="primary" busy={create.isPending} onClick={() => create.mutate()}>
                {t("workflows.createAndOpen")}
              </Button>
            )}
          </>
        }
      >
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Segmented
            value={createMode}
            onChange={setCreateMode}
            label={t("workflows.createMode")}
            options={[
              { value: "manual", label: t("workflows.createManual"), icon: FilePlus2 },
              { value: "ai", label: t("workflows.createAi"), icon: Sparkles },
            ]}
          />
          <Field label={t("common.name")} htmlFor="wf-name">
            <TextInput
              id="wf-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("workflows.namePlaceholder")}
            />
          </Field>
          <Field
            label={createMode === "ai" ? t("workflows.aiDescription") : t("common.description")}
            htmlFor="wf-description"
            hint={createMode === "ai" ? t("workflows.aiDescriptionHint") : t("workflows.descriptionHint")}
          >
            <TextArea
              id="wf-description"
              rows={createMode === "ai" ? 6 : 3}
              value={description}
              placeholder={createMode === "ai" ? t("architect.form.placeholder.create") : undefined}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          {createMode === "ai" ? (
            <ArchitectOptions generateTools={generateTools} onGenerateTools={setGenerateTools} />
          ) : (
            <p className="muted small">{t("workflows.starterNote")}</p>
          )}
        </form>
      </Modal>

      <ArchitectDialog
        open={architect !== null}
        onClose={() => setArchitect(null)}
        modes={["create"]}
        start={architect ?? undefined}
        onCreated={(id) => {
          void refresh();
          navigate(`/workflows/${id}`);
        }}
      />

      <Modal
        title={t("workflows.deleteTitle")}
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" busy={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)}>
              {t("common.deletePermanently")}
            </Button>
          </>
        }
      >
        <p>{t("workflows.deleteText", { name: deleting?.name ?? "" })}</p>
      </Modal>
    </div>
  );
}
