// "Build from local files" (ST-045): catalog models that are not in the Ollama library (source "build", e.g.
// mdenseon:307m) are built from their pinned upstream files. On an air-gapped computer the person copies the two
// files there and enters their paths; the runtime checks both against the pinned SHA-256, writes the GGUF file,
// creates the model and keeps it only if it reproduces the reference vectors (orkexa.local.build_model). Nothing is
// downloaded here: the separate download in the catalog is the online way.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Hammer, RotateCcw, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { keys } from "../api/hooks";
import { type BuildInput, type CatalogModel, type LocalJob, localApi, localKeys, useLocalJobs } from "../api/localModels";
import { Badge, Button, Callout, Field, HelpTip, Select, TextInput } from "../components/ui";
import { ErrorText, problemHint, problemText } from "../lib/errors";
import { formatLargeBytes } from "../lib/format";
import { revealSettingsSection } from "./SettingsNav";

/** The steps orkexa's build_model reports in the job message, in order. */
export const BUILD_STEPS = ["verify template", "verify weights", "write gguf", "create model", "check reference vectors"] as const;
const STEP_KEYS: Record<string, "verifyTemplate" | "verifyWeights" | "write" | "create" | "check" | "done"> = {
  "verify template": "verifyTemplate",
  "verify weights": "verifyWeights",
  "write gguf": "write",
  "create model": "create",
  "check reference vectors": "check",
  done: "done",
};

/** The error codes of a build that get their own explanation (others use the general error texts). */
const BUILD_ERROR_KEYS = {
  "local.checksum_mismatch": "checksum_mismatch",
  // The runtime checks that both paths exist before the job starts (file_missing); orkexa again (source_missing).
  "local.source_missing": "source_missing",
  "local.file_missing": "source_missing",
  "local.invalid_template": "invalid_template",
  "local.invalid_weights": "invalid_weights",
  "local.reference_mismatch": "reference_mismatch",
} as const;
const BUILD_ERRORS = new Set<string>(Object.keys(BUILD_ERROR_KEYS));

/** The models of the catalog that are built from upstream files. */
export function buildableModels(catalog: CatalogModel[]): CatalogModel[] {
  return catalog.filter((model) => model.source === "build");
}

/** The newest build job of a model. */
export function latestBuild(jobs: LocalJob[] | undefined, model: string): LocalJob | undefined {
  // The API lists the newest job first.
  return (jobs ?? []).find((job) => job.kind === "build" && job.target === model);
}

/** Which input a failed build was checking (the step in its message), or null after both were checked. */
export function failedInput(job: Pick<LocalJob, "message">): "weights" | "template" | null {
  if (job.message === "verify template") return "template";
  if (job.message === "verify weights") return "weights";
  return null;
}

/** The sentence for a failed or cancelled build, with what to do about it. */
export function buildErrorText(t: TFunction, job: LocalJob): { text: string; hint: string | null } {
  if (job.state === "cancelled" || job.error_code === "local.cancelled") return { text: t("localModels.build.errors.cancelled"), hint: null };
  const code = job.error_code ?? "";
  if (BUILD_ERRORS.has(code)) {
    const input = failedInput(job);
    const file = t(`localModels.build.inline.${input ?? "either"}`);
    const key = BUILD_ERROR_KEYS[code as keyof typeof BUILD_ERROR_KEYS];
    return { text: t(`localModels.build.errors.${key}`, { name: file }), hint: t(`localModels.build.errors.${key}Hint`, { name: file }) };
  }
  const item = { code: job.error_code, message: job.error };
  return { text: problemText(t, item), hint: problemHint(t, item) };
}

/** "lightonai/mDenseOn" and "a5fdb00" from a Hugging Face resolve URL; the host and path otherwise. */
function describeSource(url: string): { file: string; repository: string; revision: string | null } {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const resolve = parts.indexOf("resolve");
    const file = decodeURIComponent(parts.at(-1) ?? url);
    if (resolve >= 2)
      return { file, repository: parts.slice(0, resolve).join("/"), revision: parts[resolve + 1]?.slice(0, 7) ?? null };
    return { file, repository: `${parsed.host}${parts.length > 1 ? `/${parts.slice(0, -1).join("/")}` : ""}`, revision: null };
  } catch {
    return { file: url, repository: "", revision: null };
  }
}

function ExpectedFiles({ model }: { model: CatalogModel }) {
  const { t } = useTranslation();
  const inputs = [...(model.build_inputs ?? [])].sort((a, b) => (a.role === b.role ? 0 : a.role === "weights" ? -1 : 1));
  if (!inputs.length)
    return (
      <p className="muted small" data-testid="local-build-expected">
        {t("localModels.build.expectedUnlisted", { size: formatLargeBytes(model.download_bytes) })}
      </p>
    );
  return (
    <div className="stack" data-testid="local-build-expected">
      <p className="muted small">{t("localModels.build.expected")}</p>
      <ul className="stack">
        {inputs.map((input: BuildInput) => {
          const source = describeSource(input.url);
          return (
            <li key={input.role} className="small" data-testid={`local-build-input-${input.role}`}>
              <strong>{t(`localModels.build.files.${input.role}`)}</strong>: <code>{source.file}</code>
              {source.repository ? (
                <>
                  {" "}
                  · {source.repository}
                  {source.revision ? <> · {t("localModels.build.revision", { revision: source.revision })}</> : null}
                </>
              ) : null}
              {input.size === null ? null : (
                <>
                  {" "}
                  ·{" "}
                  {input.role === "template"
                    ? t("localModels.build.headerSize", { size: formatLargeBytes(input.size) })
                    : formatLargeBytes(input.size)}
                </>
              )}
              <div className="muted">
                SHA-256 <code style={{ wordBreak: "break-all" }}>{input.sha256}</code>
              </div>
              <div className="muted">
                <code style={{ wordBreak: "break-all" }}>{input.url}</code>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BuildProgress({ job }: { job: LocalJob }) {
  const { t } = useTranslation();
  const index = BUILD_STEPS.indexOf(job.message as (typeof BUILD_STEPS)[number]);
  const step = index >= 0 ? index + 1 : 0;
  const key = STEP_KEYS[job.message];
  return (
    <div className="stack" data-testid="local-build-progress">
      <progress max={BUILD_STEPS.length} value={step || undefined} aria-label={t("localModels.build.progressLabel", { model: job.target })} />
      <span className="muted small">
        {step
          ? t("localModels.build.step", { step, total: BUILD_STEPS.length, name: t(`localModels.build.steps.${key}`) })
          : t("localModels.build.starting")}
      </span>
    </div>
  );
}

/** After a successful build: the semantic index stays with its model until it is rebuilt. */
function ReindexHint({ model, embeddingModel }: { model: string; embeddingModel: string | null | undefined }) {
  const { t } = useTranslation();
  return (
    <Callout tone="info">
      <div className="stack" data-testid="local-build-reindex">
        <span>
          <CheckCircle2 size={13} aria-hidden /> {t("localModels.build.done", { model })}
        </span>
        <span>
          {embeddingModel === model ? t("localModels.build.reindexActive", { model }) : t("localModels.build.reindex", { model })}
        </span>
        <div>
          <Button size="sm" icon={Search} onClick={() => revealSettingsSection("#settings-knowledge-search")}>
            {t("localModels.build.toIndex")}
          </Button>
        </div>
      </div>
    </Callout>
  );
}

export function BuildFromFiles({
  models,
  canInstall,
  manageable,
  embeddingModel,
}: {
  models: CatalogModel[];
  canInstall: boolean;
  manageable: boolean;
  embeddingModel?: string | null;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const jobs = useLocalJobs(manageable);
  const [chosen, setChosen] = useState(models[0]?.name ?? "");
  const [weights, setWeights] = useState("");
  const [template, setTemplate] = useState("");
  const model = models.find((item) => item.name === chosen) ?? models[0];
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: localKeys.overview });
    void queryClient.invalidateQueries({ queryKey: localKeys.jobs });
    void queryClient.invalidateQueries({ queryKey: keys.settings });
  };
  const start = useMutation({
    mutationFn: (paths: { weights: string; template: string }) =>
      localApi.importModel({ kind: "build", name: model?.name ?? "", path: paths.weights, template: paths.template }),
    onSuccess: refresh,
  });
  const cancel = useMutation({ mutationFn: localApi.cancelJob, onSuccess: refresh });
  const job = model ? latestBuild(jobs.data, model.name) : undefined;
  // A finished build installs the model: the catalog and the embedding model list read it again.
  const watching = useRef<string | null>(null);
  const jobId = job?.id;
  const jobState = job?.state;
  useEffect(() => {
    if (!jobId) return;
    if (jobState === "running") watching.current = jobId;
    else if (watching.current === jobId) {
      watching.current = null;
      void queryClient.invalidateQueries({ queryKey: localKeys.overview });
    }
  }, [jobId, jobState, queryClient]);
  if (!model) return null;
  const running = job?.state === "running";
  const ready = Boolean(weights.trim() && template.trim());
  const submit = () => start.mutate({ weights: weights.trim(), template: template.trim() });
  const problem = job && (job.state === "failed" || job.state === "cancelled") ? buildErrorText(t, job) : null;
  const templateInput = model.build_inputs?.find((input) => input.role === "template");
  return (
    <div className="stack" data-testid="local-build">
      <h3 className="small">
        <Hammer size={13} aria-hidden /> {t("localModels.build.title")}{" "}
        <HelpTip id="settings.localBuild" label={t("localModels.build.title")} />
      </h3>
      <p className="muted small">{t("localModels.build.text")}</p>
      {models.length > 1 ? (
        <Field label={t("localModels.build.model")}>
          <Select value={model.name} onChange={setChosen} options={models.map((item) => ({ value: item.name, label: item.name }))} />
        </Field>
      ) : (
        <p className="small">
          <code>{model.name}</code>
          {model.vendor ? <span className="muted"> · {model.vendor}</span> : null}
          {model.license ? <span className="muted"> · {model.license}</span> : null}{" "}
          {model.installed ? <Badge tone={model.verified ? "success" : "warning"}>{t("localModels.installed")}</Badge> : null}
        </p>
      )}
      <ExpectedFiles model={model} />
      <Field label={t("localModels.build.weightsPath")} hint={t("localModels.build.weightsHint")}>
        <TextInput value={weights} onChange={(event) => setWeights(event.target.value)} spellCheck={false} disabled={running} />
      </Field>
      <Field
        label={t("localModels.build.templatePath")}
        hint={t("localModels.build.templateHint", { size: templateInput?.size ? formatLargeBytes(templateInput.size) : "–" })}
      >
        <TextInput value={template} onChange={(event) => setTemplate(event.target.value)} spellCheck={false} disabled={running} />
      </Field>
      <p className="muted small">{t("localModels.build.offlineNote")}</p>
      <div className="row-gap">
        <Button icon={Hammer} variant="primary" disabled={!canInstall || !ready || running} busy={start.isPending} onClick={submit}>
          {t("localModels.build.start")}
        </Button>
        {running && job ? (
          <Button icon={X} disabled={!canInstall} busy={cancel.isPending} onClick={() => cancel.mutate(job.id)}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
      {start.error ? (
        <Callout tone="danger">
          <ErrorText error={start.error} />
        </Callout>
      ) : null}
      {cancel.error ? (
        <Callout tone="danger">
          <ErrorText error={cancel.error} />
        </Callout>
      ) : null}
      <div aria-live="polite" className="stack">
        {running && job ? <BuildProgress job={job} /> : null}
        {problem && job ? (
          <Callout tone={job.state === "cancelled" ? "info" : "danger"}>
            <div className="stack" data-testid="local-build-error" role={job.state === "failed" ? "alert" : undefined}>
              <span>{problem.text}</span>
              {problem.hint ? <span className="muted small">{problem.hint}</span> : null}
              <div>
                <Button size="sm" icon={RotateCcw} disabled={!canInstall || !ready} busy={start.isPending} onClick={submit}>
                  {t("localModels.build.retry")}
                </Button>
              </div>
            </div>
          </Callout>
        ) : null}
        {job?.state === "done" ? <ReindexHint model={model.name} embeddingModel={embeddingModel} /> : null}
      </div>
    </div>
  );
}
