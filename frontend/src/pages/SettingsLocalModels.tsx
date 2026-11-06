// Local models (Ollama) and the knowledge search mode. The runtime manages the server (desktop: its own process;
// Nodestro Local Docker: a separate container; server: the operator's endpoint), checks every download and import, and
// recommends models for this computer; this panel shows that and starts the jobs. Nothing is downloaded or started
// without a click, and the strict offline mode refuses every download.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, Database, Download, FolderInput, Hammer, HardDrive, Play, RefreshCw, Search, Square, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { keys } from "../api/hooks";
import {
  type CatalogModel,
  type KnowledgeIndexStatus,
  type LocalJob,
  type LocalOverview,
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
import { withLocalModel } from "../missingModel/store";
import { Badge, Button, Callout, ConfirmIconButton, Field, HelpTip, Segmented, Select, Spinner, TextInput, Toggle } from "../components/ui";
import { ErrorText, problemText } from "../lib/errors";
import { formatLargeBytes } from "../lib/format";
import { reasonText } from "../lib/localRecommend";
import { BuildFromFiles, buildableModels } from "./LocalModelBuild";
import { InlineJobProgress, LocalJobsList, SetupProgress, setupJob, useJobsFinished } from "./LocalModelJobs";
import { AdviceList, FitBadge, MachinePanel, SpeedCell, catalogFit } from "./LocalModelsHardware";

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

function Recommendations({
  overview,
  onPull,
  pulling,
  downloads,
  canDownload,
}: {
  overview: LocalOverview;
  onPull: (model: string) => void;
  pulling: string | null;
  /** The running downloads by model name (their progress replaces the button). */
  downloads: Map<string, LocalJob>;
  canDownload: boolean;
}) {
  const { t } = useTranslation();
  const tasks = new Map(overview.recommendations.map((item) => [item.task, item]));
  // For a server's tenants (no hardware shown) the suggestions are for the server, not for the computer in front of them.
  const title = overview.hardware ? t("localModels.recommend.title") : t("localModels.recommend.titleServer");
  return (
    <div className="stack">
      <h3 className="small">
        {title} <HelpTip id="settings.localRecommendations" label={title} />
      </h3>
      <p className="muted small">{overview.hardware ? t("localModels.recommend.text") : t("localModels.recommend.textServer")}</p>
      {/* Focusable, so the table can be scrolled with the keyboard on a phone even when it holds no button. */}
      <div className="table-wrap" tabIndex={0} role="region" aria-label={title}>
        <table className="table table--compact" data-testid="local-recommendations">
          <thead>
            <tr>
              <th>{t("localModels.recommend.task")}</th>
              <th>{t("localModels.recommend.model")}</th>
              <th>{t("localModels.recommend.quality")}</th>
              <th>
                <span className="sr-only">{t("localModels.catalog.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {SHOWN_TASKS.map((task) => {
              const item = tasks.get(task);
              if (!item) return null;
              const name = item.model?.replace(/^ollama:/, "") ?? null;
              const why = reasonText(t, item, !overview.hardware);
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
                    {name && downloads.get(name) ? (
                      <InlineJobProgress job={downloads.get(name)!} />
                    ) : name && !item.installed ? (
                      <Button
                        size="sm"
                        icon={Download}
                        disabled={!canDownload || overview.status.offline}
                        busy={pulling === name}
                        onClick={() => onPull(name)}
                        // Several tasks may suggest the same model: the name tells the buttons apart.
                        aria-label={`${t("localModels.download", { size: formatLargeBytes(item.download_bytes) })}: ${name}`}
                      >
                        {t("localModels.download", { size: formatLargeBytes(item.download_bytes) })}
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

/**
 * The license's SPDX id. Older runtimes add an English note on where the license was read ("Apache-2.0 (upstream; the
 * Ollama manifest has no license layer)"), which is provenance for maintainers, not text of the interface.
 */
export function licenseName(license: string): string {
  return license.replace(/\s*\(.*\)\s*$/, "");
}

/**
 * Where the license was read: ``license_source`` when the API sends it; for older ones, the note means the manifest
 * had no license layer, so the publisher's model card (upstream) is the source. Null when nothing says.
 */
export function licenseSource(model: Pick<CatalogModel, "license" | "license_source">): "ollama" | "upstream" | null {
  if (model.license_source === "ollama" || model.license_source === "upstream") return model.license_source;
  return /\(.*\)\s*$/.test(model.license) ? "upstream" : null;
}

function LicenseText({ model }: { model: CatalogModel }) {
  const { t } = useTranslation();
  const source = licenseSource(model);
  return (
    <span data-testid={`local-license-${model.name}`}>
      {licenseName(model.license)}
      {source ? ` (${t(`localModels.licenseSource.${source}`)})` : ""}
    </span>
  );
}

/** Brings "Build from local files" into view and puts the focus into its first path field. */
function focusBuild() {
  const section = document.querySelector<HTMLElement>("[data-testid=local-build]");
  section?.scrollIntoView({ block: "start" });
  section?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
}

function Catalog({
  overview,
  onPull,
  pulling,
  downloads,
  canInstall,
  canDownload,
}: {
  overview: LocalOverview;
  onPull: (model: string) => void;
  pulling: string | null;
  downloads: Map<string, LocalJob>;
  canInstall: boolean;
  /** Downloads need the running model server as well as the permission. */
  canDownload: boolean;
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
  const installed = new Map(overview.status.models.map((model) => [model.name, model]));
  // A server's tenants see no hardware: the fit is the runtime's verdict for the server, and an API without one
  // leaves the column out instead of an empty one.
  const fits = new Map(overview.catalog.map((model) => [model.name, catalogFit(model, overview)]));
  const showFit = [...fits.values()].some((fit) => fit !== null);
  const row = (model: CatalogModel) => (
    <tr key={model.name} data-testid={`local-model-${model.name}`}>
      <td>
        <code>{model.name}</code>
        <div className="muted small">
          {t(`localModels.kind.${model.kind}`)} · {model.vendor ? `${model.vendor} · ` : ""}
          <LicenseText model={model} />
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
      <td className="num">{formatLargeBytes(model.download_bytes)}</td>
      <td className="num">{formatLargeBytes(model.memory_bytes)}</td>
      {showFit ? (
        <td>{fits.get(model.name) ? <FitBadge fit={fits.get(model.name)!} hardware={overview.hardware} /> : "–"}</td>
      ) : null}
      <td>
        {model.installed ? (
          <div className="stack-sm">
            <Badge tone={model.verified ? "success" : "warning"}>
              {model.verified ? t("localModels.verified") : t("localModels.unverified")}
            </Badge>
            {installed.get(model.name) ? <SpeedCell model={installed.get(model.name)!} canMeasure={canInstall && overview.status.running} /> : null}
          </div>
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
        ) : downloads.get(model.name) ? (
          <InlineJobProgress job={downloads.get(model.name)!} />
        ) : (
          <div className="row-gap">
            {/* A model built from upstream files: the download is the online way; offline, the files are entered below. */}
            {model.source === "build" && overview.status.offline ? null : (
              <Button
                size="sm"
                icon={Download}
                disabled={!canDownload || overview.status.offline}
                busy={pulling === model.name}
                onClick={() => onPull(model.name)}
                aria-label={`${t("localModels.downloadShort")}: ${model.name}`}
              >
                {t("localModels.downloadShort")}
              </Button>
            )}
            {model.source === "build" && overview.manageable && overview.status.mode !== "unavailable" ? (
              <Button
                size="sm"
                icon={Hammer}
                variant="ghost"
                onClick={() => focusBuild()}
                aria-label={`${t("localModels.build.fromFiles")}: ${model.name}`}
              >
                {t("localModels.build.fromFiles")}
              </Button>
            ) : null}
          </div>
        )}
      </td>
    </tr>
  );
  return (
    <div className="stack">
      <h3 className="small">{t("localModels.catalog.title")}</h3>
      <div className="table-wrap" tabIndex={0} role="region" aria-label={t("localModels.catalog.title")}>
        <table className="table table--compact local-catalog" data-testid="local-catalog">
          <thead>
            <tr>
              <th>{t("localModels.catalog.model")}</th>
              <th className="num">{t("localModels.catalog.download")}</th>
              <th className="num">{t("localModels.catalog.memory")}</th>
              {showFit ? <th>{overview.hardware ? t("localModels.catalog.fit") : t("localModels.catalog.fitServer")}</th> : null}
              <th>{t("localModels.catalog.state")}</th>
              <th>
                <span className="sr-only">{t("localModels.catalog.actions")}</span>
              </th>
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
                <td className="num">{formatLargeBytes(model.size)}</td>
                <td />
                {showFit ? <td /> : null}
                <td>
                  <SpeedCell model={model} canMeasure={canInstall && overview.status.running} />
                </td>
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

/**
 * Offline: an offline model package or a GGUF file on this computer (in Local Docker: inside its import folder).
 * Packages go only into a model server Nodestro manages (desktop, Local Docker); your own Ollama refuses them
 * (local.not_managed), so the choice is closed there and says why.
 */
function ImportForm({ canInstall, packages }: { canInstall: boolean; packages: boolean }) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const [chosen, setKind] = useState<"package" | "gguf">(packages ? "package" : "gguf");
  const kind = packages ? chosen : "gguf";
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
          { value: "package", label: t("localModels.import.package"), disabled: !packages, testId: "import-package" },
          { value: "gguf", label: t("localModels.import.gguf") },
        ]}
      />
      {packages ? null : (
        <p className="muted small" data-testid="import-package-external">
          {t("localModels.import.packageExternal")}
        </p>
      )}
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
          free: status.free_bytes == null ? "–" : formatLargeBytes(status.free_bytes),
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

/**
 * Without a runtime (desktop): set the server up, which downloads the pinned version (or installs it offline from its
 * release archive), starts and checks it, step by step (SetupProgress shows the steps).
 */
function RuntimeSetup({
  overview,
  canInstall,
  busy,
  retryShown = false,
}: {
  overview: LocalOverview;
  canInstall: boolean;
  busy: boolean;
  /** A failed setup's card above offers "Try again": no second download call to action next to it (ST-056). */
  retryShown?: boolean;
}) {
  const { t } = useTranslation();
  const refresh = useRefresh();
  const [archive, setArchive] = useState("");
  const install = useMutation({
    mutationFn: (source: { archive?: string; download?: boolean }) => localApi.setup(source),
    onSuccess: refresh,
    onError: toast.error,
  });
  return (
    <Callout tone="brand">
      <div className="stack" data-testid="local-runtime-setup">
        <span>{t("localModels.runtime.missing", { version: overview.status.pinned_version })}</span>
        {retryShown ? null : (
          <div className="row-gap">
            <Button
              variant="primary"
              icon={Download}
              disabled={!canInstall || overview.status.offline || busy}
              busy={install.isPending && install.variables?.download === true}
              onClick={() => install.mutate({ download: true })}
              data-testid="local-setup-start"
            >
              {t("localModels.runtime.download")}
            </Button>
            {overview.status.offline ? <span className="muted small">{t("localModels.offline.noDownloads")}</span> : null}
          </div>
        )}
        <Field label={t("localModels.runtime.archive")} hint={t("localModels.runtime.archiveHint")}>
          <TextInput value={archive} onChange={(event) => setArchive(event.target.value)} spellCheck={false} />
        </Field>
        <div>
          <Button
            icon={FolderInput}
            disabled={!canInstall || !archive.trim() || busy}
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
  onReasoning,
}: {
  settings: Settings;
  admin: boolean;
  onOffline: (value: boolean) => void;
  onEurope: (value: boolean) => void;
  /** Stores local_reasoning (the CPU saving mode for thinking models). */
  onReasoning?: (value: "auto" | "full") => void;
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
  // Starting goes through the setup job (its steps: configure, start, reachability, hardware); stopping is immediate.
  const power = useMutation({
    mutationFn: (on: boolean): Promise<unknown> => (on ? localApi.setup() : localApi.stop()),
    onSuccess: refresh,
    onError: toast.error,
  });
  const jobs = useLocalJobs(Boolean(overview.data?.manageable));
  useJobsFinished(jobs.data);
  const setup = setupJob(jobs.data);
  const settingUp = setup?.state === "running";
  const downloads = new Map(
    (jobs.data ?? [])
      .filter((job) => job.state === "running" && (job.kind === "pull" || job.kind === "build"))
      .map((job) => [job.target, job]),
  );
  const autostart = useMutation({ mutationFn: localApi.setAutostart, onSuccess: refresh, onError: toast.error });
  const data = overview.data;
  const status = data?.status;
  const manageable = Boolean(data?.manageable);
  const managed = status?.mode === "managed";
  // Downloads, imports and builds go through the model server: without it they only end in "not running".
  const serverNote = !status || status.running || !manageable || status.mode === "unavailable"
    ? null
    : managed && !status.runtime_installed
      ? "missing"
      : managed
        ? "stopped"
        : "other";
  return (
    <section className="panel stack" aria-labelledby="settings-local-models" data-testid="settings-local-models">
      <h2 className="panel__title" id="settings-local-models">
        <Database size={15} aria-hidden /> {t("localModels.title")}{" "}
        <HelpTip id="settings.localModels" label={t("localModels.title")} />
      </h2>
      <p className="muted small">{overview.data && !overview.data.hardware ? t("localModels.textServer") : t("localModels.text")}</p>
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
              {status.running
                ? t("localModels.status.running")
                : managed && !status.runtime_installed
                  ? t("localModels.status.notInstalled")
                  : status.mode === "external" || status.mode === "container"
                    ? t("localModels.status.unreachable")
                    : t("localModels.status.stopped")}
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
          {setup && manageable ? <SetupProgress job={setup} canAct={canInstall} /> : null}
          {managed && manageable && !status.runtime_installed && !settingUp ? (
            <RuntimeSetup
              overview={data}
              canInstall={canInstall}
              busy={settingUp}
              retryShown={Boolean(setup?.retryable) && (setup?.state === "failed" || setup?.state === "cancelled")}
            />
          ) : null}
          {managed && manageable && status.runtime_installed ? (
            <div className="row-gap">
              <Button
                icon={status.running ? Square : Play}
                disabled={!canInstall || settingUp}
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
          {manageable && (status.mode === "container" || status.mode === "external") ? (
            <div className="row-gap">
              <Button
                icon={Activity}
                disabled={!canInstall || settingUp}
                busy={power.isPending}
                onClick={() => power.mutate(true)}
                data-testid="local-check-server"
              >
                {t("localJobs.checkServer")}
              </Button>
              <span className="muted small">{t("localJobs.checkServerHint")}</span>
            </div>
          ) : null}
          <MachinePanel overview={data} />
          {/* The CPU saving mode toggle below says when the mode is active: not a second time here (ST-048). */}
          <AdviceList overview={data} omit={["local.reasoning_saving"]} />
          {serverNote ? (
            <p className="muted small" data-testid="local-needs-server">
              {t(`localModels.needsServer.${serverNote}`)}
            </p>
          ) : null}
          <Recommendations
            overview={data}
            canDownload={canInstall && manageable && status.running}
            downloads={downloads}
            pulling={pull.isPending ? (pull.variables ?? null) : null}
            onPull={(model) => pull.mutate(model)}
          />
          <Catalog
            overview={data}
            canInstall={canInstall && manageable}
            canDownload={canInstall && manageable && status.running}
            downloads={downloads}
            pulling={pull.isPending ? (pull.variables ?? null) : null}
            onPull={(model) => pull.mutate(model)}
          />
          {manageable ? <LocalJobsList jobs={jobs.data ?? []} catalog={data.catalog} canAct={canInstall} /> : null}
          {manageable && status.mode !== "unavailable" ? <ImportForm canInstall={canInstall && status.running} packages={status.mode === "managed" || status.mode === "container"} /> : null}
          {manageable && status.mode !== "unavailable" && buildableModels(data.catalog).length ? (
            <BuildFromFiles
              models={buildableModels(data.catalog)}
              canInstall={canInstall && status.running}
              manageable={manageable}
              embeddingModel={settings.embedding_model}
            />
          ) : null}
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
          description={data && !data.hardware ? t("localModels.offline.textServer") : t("localModels.offline.text")}
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
        <Toggle
          checked={(settings.local_reasoning ?? "auto") === "auto"}
          disabled={!admin || !onReasoning}
          onChange={(value) => onReasoning?.(value ? "auto" : "full")}
          label={t("localModels.reasoning.label")}
          description={reasoningState(t, settings, data)}
          tip="settings.localReasoning"
        />
      </div>
    </section>
  );
}

/** What the CPU saving mode does, and whether it applies on this computer now. */
function reasoningState(t: ReturnType<typeof useTranslation>["t"], settings: Settings, data: LocalOverview | undefined): string {
  const text = t("localModels.reasoning.text");
  if ((settings.local_reasoning ?? "auto") === "full") return `${text} ${t("localModels.reasoning.off")}`;
  if (data?.advice?.some((item) => item.code === "local.reasoning_saving"))
    return `${text} ${t(data.hardware ? "localModels.reasoning.active" : "localModels.reasoning.activeServer")}`;
  if (data && (data.status.accelerated === true || (data.status.accelerated === undefined && data.hardware && data.hardware.gpu !== "none")))
    return `${text} ${t("localModels.reasoning.inactive")}`;
  return text;
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
  // An embedding model that is not installed: the shared dialog downloads it, then the index is built.
  const rebuild = useMutation({
    mutationFn: () => withLocalModel(() => localApi.rebuildIndex(), { action: "knowledge_index" }),
    onSuccess: update,
    onError: toast.error,
  });
  const cancel = useMutation({ mutationFn: localApi.cancelIndex, onSuccess: update, onError: toast.error });
  const drop = useMutation({ mutationFn: localApi.dropIndex, onSuccess: update, onError: toast.error });
  const mode = settings.knowledge_retrieval ?? "fts";
  const embeddingModels = embeddingChoices(overview.data, settings.embedding_model ?? null);
  const groupInstalled = embeddingModels.some((model) => !model.installed);
  // A model that is not installed cannot build the index (the job fails with local.model_missing): say so before.
  const chosen = embeddingModels.find((model) => model.name === settings.embedding_model);
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
          options={embeddingModels.map((model) => ({
            value: model.name,
            label: model.name,
            group: groupInstalled
              ? model.installed
                ? t("localModels.installed")
                : t("localModels.status.notInstalled")
              : undefined,
          }))}
        />
      </Field>
      {chosen && !chosen.installed && overview.data ? (
        <div data-testid="embedding-not-installed">
          <Callout tone="warning">
            {overview.data.manageable
              ? t("localModels.search.notInstalled", { model: chosen.name })
              : t("localModels.search.notInstalledServer", { model: chosen.name })}
          </Callout>
        </div>
      ) : null}
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

/**
 * The embedding models to choose from: the installed ones first, then the catalog's (they must be downloaded before
 * the index can be built) and the saved one, whatever it is.
 */
export function embeddingChoices(
  overview: Pick<LocalOverview, "catalog" | "status"> | undefined,
  saved: string | null,
): { name: string; installed: boolean }[] {
  const installed = new Set([
    ...(overview?.status.models ?? []).filter((model) => model.kind === "embedding").map((model) => model.name),
    ...(overview?.catalog ?? []).filter((model) => model.kind === "embedding" && model.installed).map((model) => model.name),
  ]);
  const names = [
    ...new Set([
      ...installed,
      ...(overview?.catalog ?? []).filter((model) => model.kind === "embedding").map((model) => model.name),
      ...(saved ? [saved] : []),
    ]),
  ];
  // Without an overview (still loading) nothing is known to be missing.
  const known = overview !== undefined;
  const choices = names.map((name) => ({ name, installed: !known || installed.has(name) }));
  return [...choices.filter((item) => item.installed), ...choices.filter((item) => !item.installed)];
}
