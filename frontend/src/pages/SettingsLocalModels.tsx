// Local models (Ollama) and the knowledge search mode. The runtime manages the server (desktop: its own process;
// Nodestro Local Docker: a separate container; server: the operator's endpoint), checks every download and import, and
// recommends models for this computer; this panel shows that and starts the jobs. Nothing is downloaded or started
// without a click, and the strict offline mode refuses every download.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, Download, FolderInput, HardDrive, Play, RefreshCw, Search, Square, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { keys } from "../api/hooks";
import {
  type CatalogModel,
  type KnowledgeIndexStatus,
  type LocalJob,
  type LocalOverview,
  type Recommendation,
  isJob,
  localApi,
  localKeys,
  useKnowledgeIndex,
  useLocalJobs,
  useLocalModels,
} from "../api/localModels";
import type { Settings } from "../api/types";
import { PermissionNote } from "../components/Access";
import { toast } from "../components/toast";
import { Badge, Button, Callout, ConfirmIconButton, Field, HelpTip, Segmented, Select, Spinner, TextInput, Toggle } from "../components/ui";
import { ErrorText, problemText } from "../lib/errors";
import { formatBytes } from "../lib/format";

/** The tasks the panel recommends a model for (the runtime knows more; these cover the studio's choices). */
const SHOWN_TASKS = ["classify", "write", "tool_agent", "analysis", "assistant", "embedding"] as const;

const QUALITY_TONE = { recommended: "success", acceptable: "running", limited: "warning", insufficient: "danger" } as const;
const INDEX_TONE = {
  off: "idle",
  ready: "success",
  incomplete: "warning",
  building: "running",
  reindex_required: "warning",
  unavailable: "danger",
} as const;

function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: localKeys.overview });
    void queryClient.invalidateQueries({ queryKey: localKeys.jobs });
    // Whether Ollama counts as set up depends on the server: the provider list and the workflow check ask again.
    void queryClient.invalidateQueries({ queryKey: keys.settings });
  };
}

/** A job's progress and outcome, with a cancel button while it runs. */
function JobRow({ job, onCancel, cancelling }: { job: LocalJob; onCancel: () => void; cancelling: boolean }) {
  const { t } = useTranslation();
  const share = job.total ? Math.min(1, job.completed / job.total) : null;
  return (
    <li className="stack" data-testid={`local-job-${job.kind}`}>
      <div className="row-gap">
        <strong className="small">{t(`localModels.jobs.kind.${job.kind}`, { target: job.target })}</strong>
        <Badge tone={job.state === "done" ? "success" : job.state === "running" ? "running" : job.state === "failed" ? "danger" : "idle"}>
          {t(`localModels.jobs.state.${job.state}`)}
        </Badge>
        {job.state === "running" ? (
          <Button size="sm" icon={X} busy={cancelling} onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
      {job.state === "running" ? (
        <progress
          max={1}
          value={share ?? undefined}
          aria-label={t(`localModels.jobs.kind.${job.kind}`, { target: job.target })}
        />
      ) : null}
      {job.state === "running" && job.total ? (
        <span className="muted small">
          {t("localModels.jobs.progress", { done: formatBytes(job.completed), total: formatBytes(job.total) })}
        </span>
      ) : null}
      {job.state === "failed" ? (
        <span className="small" role="alert">
          {problemText(t, { code: job.error_code, message: job.error })}
        </span>
      ) : null}
    </li>
  );
}

function Jobs({ enabled, manageable }: { enabled: boolean; manageable: boolean }) {
  const { t } = useTranslation();
  const jobs = useLocalJobs(enabled);
  const refresh = useRefresh();
  const cancel = useMutation({ mutationFn: localApi.cancelJob, onSuccess: refresh, onError: toast.error });
  const shown = (jobs.data ?? []).slice(-5).reverse();
  if (!shown.length) return null;
  return (
    <div className="stack">
      <h3 className="small">{t("localModels.jobs.title")}</h3>
      <ul className="stack" aria-live="polite">
        {shown.map((job) => (
          <JobRow
            key={job.id}
            job={job}
            cancelling={cancel.isPending && cancel.variables === job.id}
            onCancel={() => manageable && cancel.mutate(job.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function reasonText(t: ReturnType<typeof useTranslation>["t"], item: Recommendation): string {
  return item.reasons
    .filter((reason) => reason !== "installed" && reason !== "needs_download")
    .map((reason) => t(`localModels.reasons.${reason}`, { model: item.better ?? "" }))
    .join(" ");
}

function Recommendations({ overview, onPull, pulling, canInstall }: { overview: LocalOverview; onPull: (model: string) => void; pulling: string | null; canInstall: boolean }) {
  const { t } = useTranslation();
  const tasks = new Map(overview.recommendations.map((item) => [item.task, item]));
  return (
    <div className="stack">
      <h3 className="small">
        {t("localModels.recommend.title")} <HelpTip id="settings.localRecommendations" label={t("localModels.recommend.title")} />
      </h3>
      <p className="muted small">{t("localModels.recommend.text")}</p>
      <div className="table-wrap">
        <table className="table table--compact" data-testid="local-recommendations">
          <thead>
            <tr>
              <th>{t("localModels.recommend.task")}</th>
              <th>{t("localModels.recommend.model")}</th>
              <th>{t("localModels.recommend.quality")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {SHOWN_TASKS.map((task) => {
              const item = tasks.get(task);
              if (!item) return null;
              const name = item.model?.replace(/^ollama:/, "") ?? null;
              const why = reasonText(t, item);
              return (
                <tr key={task}>
                  <td>{t(`localModels.tasks.${task}`)}</td>
                  <td>
                    {name ? <code>{name}</code> : "–"}
                    {why ? <div className="muted small">{why}</div> : null}
                  </td>
                  <td>
                    <Badge tone={QUALITY_TONE[item.quality]}>{t(`localModels.quality.${item.quality}`)}</Badge>
                  </td>
                  <td>
                    {name && !item.installed ? (
                      <Button
                        size="sm"
                        icon={Download}
                        disabled={!canInstall || overview.status.offline}
                        busy={pulling === name}
                        onClick={() => onPull(name)}
                      >
                        {t("localModels.download", { size: formatBytes(item.download_bytes) })}
                      </Button>
                    ) : name ? (
                      <span className="muted small">{t("localModels.installed")}</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Catalog({
  overview,
  onPull,
  pulling,
  canInstall,
}: {
  overview: LocalOverview;
  onPull: (model: string) => void;
  pulling: string | null;
  canInstall: boolean;
}) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const remove = useMutation({
    mutationFn: localApi.deleteModel,
    onSuccess: (_data, name) => {
      refresh();
      toast.success(t("localModels.deleted", { model: name }));
    },
    onError: toast.error,
  });
  const extra = overview.status.models.filter((model) => !model.catalog);
  const row = (model: CatalogModel) => (
    <tr key={model.name} data-testid={`local-model-${model.name}`}>
      <td>
        <code>{model.name}</code>
        <div className="muted small">
          {t(`localModels.kind.${model.kind}`)} · {model.vendor ? `${model.vendor} · ` : ""}
          {model.license}
        </div>
        {model.region === "eu" || model.tasks?.length ? (
          <div className="muted small">
            {model.region === "eu" ? <Badge tone="idle">{t("localModels.europe.badge")}</Badge> : null}{" "}
            {model.tasks?.length
              ? t("localModels.onlyFor", { tasks: model.tasks.map((task) => t(`localModels.tasks.${task}`)).join(", ") })
              : null}
          </div>
        ) : null}
      </td>
      <td className="num">{formatBytes(model.download_bytes)}</td>
      <td className="num">{formatBytes(model.memory_bytes)}</td>
      <td>
        {model.installed ? (
          <Badge tone={model.verified ? "success" : "warning"}>
            {model.verified ? t("localModels.verified") : t("localModels.unverified")}
          </Badge>
        ) : null}
      </td>
      <td>
        {model.installed ? (
          <ConfirmIconButton
            icon={Trash2}
            label={t("localModels.delete", { model: model.name })}
            disabled={!canInstall}
            busy={remove.isPending && remove.variables === model.name}
            onConfirm={() => remove.mutate(model.name)}
          />
        ) : (
          <Button
            size="sm"
            icon={Download}
            disabled={!canInstall || overview.status.offline}
            busy={pulling === model.name}
            onClick={() => onPull(model.name)}
          >
            {t("localModels.downloadShort")}
          </Button>
        )}
      </td>
    </tr>
  );
  return (
    <div className="stack">
      <h3 className="small">{t("localModels.catalog.title")}</h3>
      <div className="table-wrap">
        <table className="table table--compact" data-testid="local-catalog">
          <thead>
            <tr>
              <th>{t("localModels.catalog.model")}</th>
              <th className="num">{t("localModels.catalog.download")}</th>
              <th className="num">{t("localModels.catalog.memory")}</th>
              <th>{t("localModels.catalog.state")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {overview.catalog.map(row)}
            {extra.map((model) => (
              <tr key={model.name}>
                <td>
                  <code>{model.name}</code>
                  <div className="muted small">{t("localModels.catalog.own")}</div>
                </td>
                <td className="num">{formatBytes(model.size)}</td>
                <td />
                <td />
                <td>
                  <ConfirmIconButton
                    icon={Trash2}
                    label={t("localModels.delete", { model: model.name })}
                    disabled={!canInstall}
                    onConfirm={() => remove.mutate(model.name)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Offline: an offline model package or a GGUF file on this computer (in Local Docker: inside its import folder). */
function ImportForm({ canInstall }: { canInstall: boolean }) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const [kind, setKind] = useState<"package" | "gguf">("package");
  const [path, setPath] = useState("");
  const [name, setName] = useState("");
  const [projector, setProjector] = useState("");
  const start = useMutation({
    mutationFn: () =>
      localApi.importModel(
        kind === "gguf" ? { kind, path: path.trim(), name: name.trim(), projector: projector.trim() || null } : { kind, path: path.trim() },
      ),
    onSuccess: () => {
      refresh();
      toast.info(t("localModels.import.started"));
    },
    onError: toast.error,
  });
  return (
    <div className="stack" data-testid="local-import">
      <h3 className="small">
        {t("localModels.import.title")} <HelpTip id="settings.localImport" label={t("localModels.import.title")} />
      </h3>
      <Segmented
        label={t("localModels.import.title")}
        value={kind}
        onChange={setKind}
        options={[
          { value: "package", label: t("localModels.import.package") },
          { value: "gguf", label: t("localModels.import.gguf") },
        ]}
      />
      <Field label={kind === "gguf" ? t("localModels.import.ggufPath") : t("localModels.import.packagePath")} hint={t("localModels.import.pathHint")}>
        <TextInput value={path} onChange={(event) => setPath(event.target.value)} spellCheck={false} />
      </Field>
      {kind === "gguf" ? (
        <>
          <Field label={t("localModels.import.name")} hint={t("localModels.import.nameHint")}>
            <TextInput value={name} onChange={(event) => setName(event.target.value)} spellCheck={false} />
          </Field>
          <Field label={t("localModels.import.projector")} hint={t("localModels.import.projectorHint")}>
            <TextInput value={projector} onChange={(event) => setProjector(event.target.value)} spellCheck={false} />
          </Field>
        </>
      ) : null}
      <div>
        <Button
          icon={FolderInput}
          disabled={!canInstall || !path.trim() || (kind === "gguf" && !name.trim())}
          busy={start.isPending}
          onClick={() => start.mutate()}
        >
          {t("localModels.import.start")}
        </Button>
      </div>
    </div>
  );
}

function StorageForm({ overview, canInstall }: { overview: LocalOverview; canInstall: boolean }) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const [path, setPath] = useState("");
  const [transfer, setTransfer] = useState<"copy" | "use">("copy");
  const move = useMutation({
    mutationFn: () => localApi.setStorage(path.trim(), transfer),
    onSuccess: (result) => {
      refresh();
      toast.info(isJob(result) ? t("localModels.storage.copying") : t("localModels.storage.switched"));
    },
    onError: toast.error,
  });
  const { status } = overview;
  return (
    <div className="stack" data-testid="local-storage">
      <h3 className="small">
        <HardDrive size={13} aria-hidden /> {t("localModels.storage.title")}{" "}
        <HelpTip id="settings.localStorage" label={t("localModels.storage.title")} />
      </h3>
      <p className="muted small">
        {t("localModels.storage.current", {
          path: status.models_dir ?? "–",
          free: status.free_bytes === null ? "–" : formatBytes(status.free_bytes),
        })}
      </p>
      <Field label={t("localModels.storage.path")} hint={t("localModels.storage.pathHint")}>
        <TextInput value={path} onChange={(event) => setPath(event.target.value)} spellCheck={false} />
      </Field>
      <Field label={t("localModels.storage.transfer")}>
        <Select
          value={transfer}
          onChange={(value) => setTransfer(value as "copy" | "use")}
          options={[
            { value: "copy", label: t("localModels.storage.copy") },
            { value: "use", label: t("localModels.storage.use") },
          ]}
        />
      </Field>
      <div>
        <Button icon={HardDrive} disabled={!canInstall || !path.trim()} busy={move.isPending} onClick={() => move.mutate()}>
          {t("localModels.storage.apply")}
        </Button>
      </div>
    </div>
  );
}

/** Without a runtime (desktop): install the pinned version by download, or offline from its release archive. */
function RuntimeSetup({ overview, canInstall }: { overview: LocalOverview; canInstall: boolean }) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const [archive, setArchive] = useState("");
  const install = useMutation({
    mutationFn: (source: { archive?: string; download?: boolean }) => localApi.installRuntime(source),
    onSuccess: refresh,
    onError: toast.error,
  });
  return (
    <Callout tone="brand">
      <div className="stack" data-testid="local-runtime-setup">
        <span>{t("localModels.runtime.missing", { version: overview.status.pinned_version })}</span>
        <div className="row-gap">
          <Button
            variant="primary"
            icon={Download}
            disabled={!canInstall || overview.status.offline}
            busy={install.isPending && install.variables?.download === true}
            onClick={() => install.mutate({ download: true })}
          >
            {t("localModels.runtime.download")}
          </Button>
          {overview.status.offline ? <span className="muted small">{t("localModels.offline.noDownloads")}</span> : null}
        </div>
        <Field label={t("localModels.runtime.archive")} hint={t("localModels.runtime.archiveHint")}>
          <TextInput value={archive} onChange={(event) => setArchive(event.target.value)} spellCheck={false} />
        </Field>
        <div>
          <Button
            icon={FolderInput}
            disabled={!canInstall || !archive.trim()}
            busy={install.isPending && Boolean(install.variables?.archive)}
            onClick={() => install.mutate({ archive: archive.trim() })}
          >
            {t("localModels.runtime.fromArchive")}
          </Button>
        </div>
      </div>
    </Callout>
  );
}

export function LocalModelsPanel({
  settings,
  admin,
  onOffline,
  onEurope,
}: {
  settings: Settings;
  admin: boolean;
  onOffline: (value: boolean) => void;
  onEurope: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const access = useAccess();
  const canInstall = access.can("install");
  const overview = useLocalModels();
  const refresh = useRefresh();
  const pull = useMutation({
    mutationFn: localApi.pull,
    onSuccess: refresh,
    onError: toast.error,
  });
  const power = useMutation({
    mutationFn: (on: boolean) => (on ? localApi.start() : localApi.stop()),
    onSuccess: refresh,
    onError: toast.error,
  });
  const autostart = useMutation({ mutationFn: localApi.setAutostart, onSuccess: refresh, onError: toast.error });
  const data = overview.data;
  const status = data?.status;
  const manageable = Boolean(data?.manageable);
  const managed = status?.mode === "managed";
  const ram = data?.hardware.ram_bytes;
  return (
    <section className="panel stack" aria-labelledby="settings-local-models" data-testid="settings-local-models">
      <h2 className="panel__title" id="settings-local-models">
        <Database size={15} aria-hidden /> {t("localModels.title")}{" "}
        <HelpTip id="settings.localModels" label={t("localModels.title")} />
      </h2>
      <p className="muted small">{t("localModels.text")}</p>
      {overview.error ? (
        <Callout tone="danger">
          <ErrorText error={overview.error} />
        </Callout>
      ) : !data || !status ? (
        <Spinner />
      ) : (
        <>
          <div className="row-gap" data-testid="local-status">
            <Badge tone={status.running ? "success" : status.mode === "unavailable" ? "danger" : "idle"}>
              {status.running ? t("localModels.status.running") : t("localModels.status.stopped")}
            </Badge>
            <span className="small">{t(`localModels.mode.${status.mode}`)}</span>
            {status.version ? <span className="muted small">Ollama {status.version}</span> : null}
            {status.base_url ? <code className="small">{status.base_url}</code> : null}
          </div>
          {status.error_code ? (
            <Callout tone="warning">{problemText(t, { code: status.error_code, message: status.error })}</Callout>
          ) : null}
          {!manageable ? <Callout tone="info">{t("localModels.serverManaged")}</Callout> : null}
          {status.mode === "unavailable" && manageable ? <Callout tone="info">{t("localModels.unavailable")}</Callout> : null}
          {status.detected_external && managed ? (
            <Callout tone="info">{t("localModels.detected", { url: status.detected_external })}</Callout>
          ) : null}
          {managed && manageable && !status.runtime_installed ? <RuntimeSetup overview={data} canInstall={canInstall} /> : null}
          {managed && manageable && status.runtime_installed ? (
            <div className="row-gap">
              <Button
                icon={status.running ? Square : Play}
                disabled={!canInstall}
                busy={power.isPending}
                onClick={() => power.mutate(!status.running)}
              >
                {status.running ? t("localModels.stop") : t("localModels.start")}
              </Button>
              <Toggle
                checked={status.autostart}
                disabled={!canInstall}
                onChange={(value) => autostart.mutate(value)}
                label={t("localModels.autostart")}
              />
            </div>
          ) : null}
          <p className="muted small" data-testid="local-hardware">
            {t("localModels.hardware", {
              cpus: data.hardware.cpus,
              ram: ram ? formatBytes(ram) : "–",
              gpu: t(`localModels.gpu.${data.hardware.gpu}`),
            })}
          </p>
          <Recommendations
            overview={data}
            canInstall={canInstall && manageable}
            pulling={pull.isPending ? (pull.variables ?? null) : null}
            onPull={(model) => pull.mutate(model)}
          />
          <Catalog
            overview={data}
            canInstall={canInstall && manageable}
            pulling={pull.isPending ? (pull.variables ?? null) : null}
            onPull={(model) => pull.mutate(model)}
          />
          <Jobs enabled={manageable} manageable={manageable} />
          {manageable && status.mode !== "unavailable" ? <ImportForm canInstall={canInstall} /> : null}
          {manageable && managed ? <StorageForm overview={data} canInstall={canInstall} /> : null}
          <PermissionNote permission="install" access={access} />
        </>
      )}
      <div className="stack">
        <Toggle
          checked={Boolean(settings.strict_offline)}
          disabled={!admin}
          onChange={onOffline}
          label={t("localModels.offline.label")}
          description={t("localModels.offline.text")}
          tip="settings.strictOffline"
        />
        <Toggle
          checked={Boolean(settings.prefer_european_models)}
          disabled={!admin}
          onChange={onEurope}
          label={t("localModels.europe.label")}
          description={t("localModels.europe.text")}
          tip="settings.preferEuropean"
        />
      </div>
    </section>
  );
}

function indexLine(t: ReturnType<typeof useTranslation>["t"], index: KnowledgeIndexStatus): string {
  if (index.state === "building" && index.job)
    return t("localModels.index.buildingProgress", { done: index.job.completed, total: index.job.total });
  return t(`localModels.index.state.${index.state}`, { embedded: index.embedded, chunks: index.chunks });
}

/** How knowledge is searched, the embedding model and the semantic index. */
export function KnowledgeSearchPanel({
  settings,
  admin,
  onSave,
}: {
  settings: Settings;
  admin: boolean;
  onSave: (change: Pick<Settings, "knowledge_retrieval" | "embedding_model">) => void;
}) {
  const { t } = useTranslation();
  const access = useAccess();
  const canEdit = access.can("edit");
  const index = useKnowledgeIndex();
  const overview = useLocalModels();
  const queryClient = useQueryClient();
  const update = (data: KnowledgeIndexStatus) => queryClient.setQueryData(localKeys.index, data);
  const rebuild = useMutation({ mutationFn: () => localApi.rebuildIndex(), onSuccess: update, onError: toast.error });
  const cancel = useMutation({ mutationFn: localApi.cancelIndex, onSuccess: update, onError: toast.error });
  const drop = useMutation({ mutationFn: localApi.dropIndex, onSuccess: update, onError: toast.error });
  const mode = settings.knowledge_retrieval ?? "fts";
  const embeddingModels = [
    ...new Set([
      ...(overview.data?.catalog ?? []).filter((model) => model.kind === "embedding").map((model) => model.name),
      ...(overview.data?.status.models ?? []).filter((model) => model.kind === "embedding").map((model) => model.name),
      ...(settings.embedding_model ? [settings.embedding_model] : []),
    ]),
  ];
  const data = index.data;
  const running = data?.job?.state === "running";
  return (
    <section className="panel stack" aria-labelledby="settings-knowledge-search" data-testid="settings-knowledge-search">
      <h2 className="panel__title" id="settings-knowledge-search">
        <Search size={15} aria-hidden /> {t("localModels.search.title")}{" "}
        <HelpTip id="settings.knowledgeSearch" label={t("localModels.search.title")} />
      </h2>
      <p className="muted small">{t("localModels.search.text")}</p>
      <Field label={t("localModels.search.mode")} hint={t(`localModels.search.modeHint.${mode}`)}>
        <Select
          value={mode}
          disabled={!admin}
          onChange={(value) => onSave({ knowledge_retrieval: value as "fts" | "vector" | "hybrid" })}
          options={(["fts", "vector", "hybrid"] as const).map((value) => ({ value, label: t(`localModels.search.modes.${value}`) }))}
        />
      </Field>
      <Field label={t("localModels.search.embeddingModel")} hint={t("localModels.search.embeddingHint")}>
        <Select
          value={settings.embedding_model ?? ""}
          disabled={!admin}
          placeholder={t("localModels.search.noModel")}
          onChange={(value) => onSave({ embedding_model: value || null })}
          options={embeddingModels.map((name) => ({ value: name, label: name }))}
        />
      </Field>
      {index.error ? (
        <Callout tone="danger">
          <ErrorText error={index.error} />
        </Callout>
      ) : data ? (
        <div className="stack" data-testid="knowledge-index">
          <div className="row-gap">
            <Badge tone={INDEX_TONE[data.state]}>{t(`localModels.index.badge.${data.state}`)}</Badge>
            <span className="small">{indexLine(t, data)}</span>
          </div>
          {data.job?.state === "failed" ? (
            <span className="small" role="alert">
              {problemText(t, { code: data.job.error_code, message: data.job.error })}
            </span>
          ) : null}
          {mode !== "fts" && data.state !== "ready" && data.state !== "building" ? (
            <Callout tone="warning">{t("localModels.index.needed")}</Callout>
          ) : null}
          <div className="row-gap">
            <Button
              icon={RefreshCw}
              disabled={!canEdit || running || !settings.embedding_model}
              busy={rebuild.isPending}
              onClick={() => rebuild.mutate()}
            >
              {data.state === "off" ? t("localModels.index.build") : t("localModels.index.rebuild")}
            </Button>
            {running ? (
              <Button icon={X} disabled={!canEdit} busy={cancel.isPending} onClick={() => cancel.mutate()}>
                {t("common.cancel")}
              </Button>
            ) : null}
            {data.state !== "off" ? (
              <ConfirmIconButton
                icon={Trash2}
                label={t("localModels.index.remove")}
                disabled={!canEdit || running}
                busy={drop.isPending}
                onConfirm={() => drop.mutate()}
              />
            ) : null}
          </div>
          <PermissionNote permission="edit" access={access} />
        </div>
      ) : (
        <Spinner />
      )}
    </section>
  );
}
