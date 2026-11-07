// The local model server's jobs as the runtime reports them: setting the server up step by step, model downloads with
// their measured bytes, rate and remaining time, imports and builds. Every value shown comes from the job; nothing is
// estimated here. A percentage appears only for a step that counts bytes, every other running step has an
// indeterminate bar. Jobs live on the server, so a reload of the page shows them again (and after a restart of
// Nodestro the last ones are still listed, a running one as interrupted).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { keys } from "../api/hooks";
import { type CatalogModel, type LocalJob, type LocalJobStep, localApi, localKeys } from "../api/localModels";
import {
  LiveAnnouncer,
  ProgressBar,
  type ProgressStep,
  StepList,
  TechnicalDetails,
  formatPercent,
  formatRate,
  formatSeconds,
  shareOf,
} from "../components/Progress";
import { toast } from "../components/toast";
import { Badge, Button } from "../components/ui";
import { problemText } from "../lib/errors";
import { formatLargeBytes, formatTime } from "../lib/format";

type T = ReturnType<typeof useTranslation>["t"];

/** Kinds whose steps have their own names (other jobs show one bar). */
const STEP_KINDS = new Set(["setup", "install_runtime", "pull", "build"]);
/** Kinds the interface can start again with what the job knows. */
const RETRY_KINDS = new Set(["setup", "install_runtime", "pull", "build", "benchmark"]);
/** How long a finished setup stays in view (its outcome; a failed one stays until it is started again). */
const SETUP_SHOWN_MS = 10 * 60 * 1000;

const STATE_TONE = { running: "running", done: "success", failed: "danger", cancelled: "idle" } as const;

function stepKind(job: LocalJob): string {
  return job.kind === "install_runtime" ? "setup" : job.kind;
}

/** The job's name, e.g. "Download qwen3.5:4b" or "Set up the local model server". */
export function jobTitle(t: T, job: LocalJob): string {
  if (job.kind === "setup") return t("localJobs.kind.setup");
  return t(`localModels.jobs.kind.${job.kind}`, { target: job.target });
}

export function stepLabel(t: T, job: LocalJob, step: Pick<LocalJobStep, "id">): string {
  return t(`localJobs.steps.${stepKind(job)}.${step.id}`, { defaultValue: step.id });
}

/** The note of a step in words; unknown notes are left out rather than shown as codes. */
function stepNote(t: T, step: LocalJobStep): string | null {
  if (!step.note) return null;
  return t(`localJobs.notes.${step.note}`, { defaultValue: "" }) || null;
}

/** The running step's position, e.g. "Step 3 of 10: Download Ollama". */
export function currentStepText(t: T, job: LocalJob): string | null {
  const steps = job.steps ?? [];
  const index = steps.findIndex((step) => step.state === "running");
  if (index < 0) return null;
  return t("localJobs.stepOf", { index: index + 1, count: steps.length, step: stepLabel(t, job, steps[index]) });
}

/** What the person should do after a failure, by its code (null: nothing specific beyond the error itself). */
export function remedyText(t: T, job: LocalJob): string | null {
  if (job.state === "cancelled") return t(job.kind === "pull" || job.kind === "setup" || job.kind === "install_runtime" ? "localJobs.remedy.cancelledResume" : "localJobs.remedy.cancelled");
  const code = job.error_code?.replace(/^local\./, "");
  if (!code) return null;
  return t(`localJobs.remedy.${code}`, { defaultValue: "" }) || t("localJobs.remedy.generic");
}

/** A job that was stopped (by the user or by the end of Nodestro) and continues where it stopped. */
function resumes(job: LocalJob): boolean {
  return job.state === "cancelled" || job.error_code === "local.interrupted";
}

/** The current file of a model download whose total is not final yet (Ollama names each file only when it starts). */
function currentFile(job: LocalJob) {
  const layers = job.layers ?? [];
  return job.kind === "pull" && job.total_final === false && layers.length ? { layer: layers[layers.length - 1], index: layers.length } : null;
}

/** The bar and the measured facts of the running step. */
function Measured({ job, label }: { job: LocalJob; label: string }) {
  const { t } = useTranslation();
  const counted = !job.steps?.length || job.progress_step === job.phase;
  const file = counted ? currentFile(job) : null;
  const share = !counted ? null : file ? shareOf(file.layer.completed, file.layer.total) : shareOf(job.completed, job.total);
  const bytes = counted && job.completed > 0;
  const facts: string[] = [];
  if (file && file.layer.total) {
    facts.push(t("localJobs.facts.file", { index: file.index, done: formatLargeBytes(file.layer.completed), total: formatLargeBytes(file.layer.total) }));
    facts.push(t("localJobs.facts.soFar", { done: formatLargeBytes(job.completed) }));
  } else if (bytes && job.total) {
    facts.push(t("localJobs.facts.bytes", { done: formatLargeBytes(job.completed), total: formatLargeBytes(job.total) }));
  } else if (bytes) {
    facts.push(t("localJobs.facts.soFar", { done: formatLargeBytes(job.completed) }));
  }
  if (share !== null) facts.push(formatPercent(share));
  if (job.rate != null && job.rate > 0) facts.push(formatRate(job.rate));
  if (job.eta_seconds != null)
    facts.push(t(job.eta_scope === "file" ? "localJobs.facts.etaFile" : "localJobs.facts.eta", { time: formatSeconds(job.eta_seconds) }));
  const valueText = [share !== null ? formatPercent(share) : t("progress.indeterminate"), ...facts.filter((fact) => fact !== (share !== null ? formatPercent(share) : ""))].join(", ");
  return (
    <div className="stack-sm">
      <ProgressBar share={share} label={label} valueText={valueText} testId={`local-job-bar-${job.kind}`} />
      {facts.length ? (
        <div className="local-job__facts" data-testid="local-job-facts">
          {facts.map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </div>
      ) : null}
      {job.stalled_seconds != null ? (
        <span className="local-job__hint" data-testid="local-job-stalled">
          {t("localJobs.stalled", { time: formatSeconds(job.stalled_seconds) })}
        </span>
      ) : null}
      {job.resumed_bytes ? (
        <span className="local-job__hint">{t("localJobs.resumed", { size: formatLargeBytes(job.resumed_bytes) })}</span>
      ) : null}
    </div>
  );
}

function Details({ job, catalog }: { job: LocalJob; catalog?: CatalogModel | null }) {
  const { t } = useTranslation();
  const lines = [
    `${t("localJobs.details.job")}: ${job.kind} ${job.target} (${job.id})`,
    `${t("localJobs.details.started")}: ${formatTime(job.started_at)}${job.finished_at ? ` · ${t("localJobs.details.finished")}: ${formatTime(job.finished_at)}` : ""}`,
    ...(catalog ? [`${t("localJobs.details.digest")}: ${catalog.digest}`] : []),
    ...(job.error ? [`${t("localJobs.details.error")}: ${job.error_code ?? ""} ${job.error}`] : []),
    ...(job.steps ?? []).filter((step) => step.detail).map((step) => `${stepLabel(t, job, step)}: ${step.detail}`),
    ...(job.layers ?? []).map((layer) => `${layer.digest.slice(0, 19)}: ${layer.completed} / ${layer.total ?? "?"} bytes`),
  ];
  return (
    <TechnicalDetails testId="local-job-details">
      <pre>{lines.join("\n")}</pre>
      {job.log?.length ? <pre aria-label={t("localJobs.details.log")}>{job.log.join("\n")}</pre> : null}
    </TechnicalDetails>
  );
}

/**
 * One job: what it is, its state, its steps (the running one with its bar), what happens next or what to do, and
 * technical details on request.
 */
export function JobCard({
  job,
  catalog,
  canAct,
  onCancel,
  onRetry,
  cancelling = false,
  retrying = false,
}: {
  job: LocalJob;
  /** The catalog entry of a downloaded or built model (its publisher and verified digest). */
  catalog?: CatalogModel | null;
  canAct: boolean;
  onCancel: () => void;
  onRetry?: () => void;
  cancelling?: boolean;
  retrying?: boolean;
}) {
  const { t } = useTranslation();
  const title = jobTitle(t, job);
  const running = job.state === "running";
  const steps = STEP_KINDS.has(job.kind) ? (job.steps ?? []) : [];
  const now = currentStepText(t, job);
  const remedy = job.state === "failed" || job.state === "cancelled" ? remedyText(t, job) : null;
  const retry = onRetry && job.retryable && RETRY_KINDS.has(job.kind) && !running;
  const listed: ProgressStep[] = steps.map((step) => ({
    id: step.id,
    label: stepLabel(t, job, step),
    state: step.state,
    note: stepNote(t, step),
    children: step.state === "running" ? <Measured job={job} label={`${title}: ${stepLabel(t, job, step)}`} /> : undefined,
  }));
  const announce = running ? (now ?? title) : `${title}: ${t(`localModels.jobs.state.${job.state}`)}`;
  return (
    <article className={`local-job local-job--${job.state}`} aria-label={title} data-testid={`local-job-${job.kind}`} data-state={job.state}>
      <div className="local-job__head">
        <span className="local-job__title">{title}</span>
        <Badge tone={STATE_TONE[job.state]}>{t(`localModels.jobs.state.${job.state}`)}</Badge>
        <div className="local-job__actions">
          {running ? (
            <Button size="sm" icon={X} busy={cancelling} disabled={!canAct} onClick={onCancel} aria-label={`${t("common.cancel")}: ${title}`}>
              {t("common.cancel")}
            </Button>
          ) : null}
          {retry ? (
            <Button
              size="sm"
              icon={resumes(job) ? Play : RotateCcw}
              busy={retrying}
              disabled={!canAct}
              onClick={onRetry}
              aria-label={`${t(resumes(job) ? "localJobs.resume" : "localJobs.retry")}: ${title}`}
            >
              {t(resumes(job) ? "localJobs.resume" : "localJobs.retry")}
            </Button>
          ) : null}
        </div>
      </div>
      {catalog?.vendor ? (
        <span className="local-job__hint">{t("localJobs.model", { vendor: catalog.vendor, family: catalog.family })}</span>
      ) : null}
      {running ? (
        <span className="small" data-testid="local-job-now">
          {now ?? t("localJobs.working")} <span className="muted">{t("localJobs.noAction")}</span>
        </span>
      ) : job.state === "done" ? (
        <span className="small">{t(`localJobs.done.${job.kind === "setup" || job.kind === "pull" ? job.kind : "other"}`, { target: job.target })}</span>
      ) : (
        <div className="stack-sm" role={job.state === "failed" ? "alert" : undefined} data-testid="local-job-problem">
          <strong className="small">{job.state === "failed" ? t("localJobs.actionNeeded") : t("localJobs.stopped")}</strong>
          {job.state === "failed" ? <span className="small">{problemText(t, { code: job.error_code, message: job.error })}</span> : null}
          {remedy ? <span className="small">{remedy}</span> : null}
        </div>
      )}
      {listed.length ? (
        <StepList steps={listed} label={t("localJobs.stepsOf", { title })} testId={`local-job-steps-${job.kind}`} />
      ) : running ? (
        <Measured job={job} label={title} />
      ) : null}
      <Details job={job} catalog={catalog} />
      <LiveAnnouncer message={announce} />
    </article>
  );
}

/** Starts a job again the way it was started (a download continues where it stopped). */
function retryJob(job: LocalJob): Promise<LocalJob> {
  if (job.kind === "pull" || job.kind === "build") return localApi.pull(job.target);
  if (job.kind === "benchmark") return localApi.benchmark(job.target);
  const archive = job.steps?.find((step) => step.id === "download" && step.note === "archive")?.detail;
  return localApi.setup(archive ? { archive } : { download: true });
}

/** Refreshes what depends on the jobs: the overview (installed models, the server) and the provider list. */
export function useLocalRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: localKeys.overview });
    void queryClient.invalidateQueries({ queryKey: localKeys.jobs });
    void queryClient.invalidateQueries({ queryKey: keys.settings });
  };
}

/** The job ids of one look at the job list: all of them and the running ones. */
export type JobSnapshot = { all: Set<string>; running: Set<string> };

/**
 * Whether a job ended between two looks at the job list: one that ran before and runs no longer, or one that is new
 * and already over (a speed measurement or an import can start and end between two polls, ST-043). The first look
 * (``before`` null) only remembers: the jobs that ended before the page opened are already in the overview.
 */
export function jobsEnded(before: JobSnapshot | null, jobs: LocalJob[]): { ended: boolean; now: JobSnapshot } {
  const now = {
    all: new Set(jobs.map((job) => job.id)),
    running: new Set(jobs.filter((job) => job.state === "running").map((job) => job.id)),
  };
  if (before === null) return { ended: false, now };
  const stopped = [...before.running].some((id) => !now.running.has(id));
  const quick = jobs.some((job) => job.state !== "running" && !before.all.has(job.id));
  return { ended: stopped || quick, now };
}

/** When a running job ends (also one started in another tab), the overview is fetched again. */
export function useJobsFinished(jobs: LocalJob[] | undefined) {
  const refresh = useLocalRefresh();
  const seen = useRef<JobSnapshot | null>(null);
  useEffect(() => {
    if (jobs === undefined) return;
    const { ended, now } = jobsEnded(seen.current, jobs);
    seen.current = now;
    if (ended) refresh();
    // refresh is a new function each render; the job states decide.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);
}

export function useJobActions() {
  const { t } = useTranslation();
  const refresh = useLocalRefresh();
  const cancel = useMutation({ mutationFn: localApi.cancelJob, onSuccess: refresh, onError: toast.error });
  const retry = useMutation({
    mutationFn: retryJob,
    onSuccess: () => {
      refresh();
      toast.info(t("localJobs.restarted"));
    },
    onError: toast.error,
  });
  return { cancel, retry };
}

/** The newest setup job while it runs, failed or was cancelled, or finished in the last minutes. */
export function setupJob(jobs: LocalJob[] | undefined): LocalJob | null {
  const found = (jobs ?? []).find((job) => job.kind === "setup" || job.kind === "install_runtime");
  if (!found) return null;
  if (found.state !== "done") return found;
  const ended = found.finished_at ? Date.parse(found.finished_at) : 0;
  return Date.now() - ended < SETUP_SHOWN_MS ? found : null;
}

/** The setup of the local model server, step by step. */
export function SetupProgress({ job, canAct }: { job: LocalJob; canAct: boolean }) {
  const { cancel, retry } = useJobActions();
  return (
    <div data-testid="local-setup-progress">
      <JobCard
        job={job}
        canAct={canAct}
        cancelling={cancel.isPending && cancel.variables === job.id}
        retrying={retry.isPending}
        onCancel={() => cancel.mutate(job.id)}
        onRetry={() => retry.mutate(job)}
      />
    </div>
  );
}

/** Downloads and other jobs (not the setup, which has its own place): running ones first, then the last finished. */
export function LocalJobsList({ jobs, catalog, canAct }: { jobs: LocalJob[]; catalog: CatalogModel[]; canAct: boolean }) {
  const { t } = useTranslation();
  const { cancel, retry } = useJobActions();
  // The newest job of each model only (the list is newest first): an older failed or canceled attempt is history.
  const seen = new Set<string>();
  const others = jobs.filter((job) => {
    const key = `${job.kind}:${job.target}`;
    if (job.kind === "setup" || job.kind === "install_runtime" || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const shown = [...others.filter((job) => job.state === "running"), ...others.filter((job) => job.state !== "running").slice(0, 5)];
  if (!shown.length) return null;
  const byName = new Map(catalog.map((model) => [model.name, model]));
  return (
    <div className="stack" data-testid="local-jobs">
      <h3 className="small">{t("localModels.jobs.title")}</h3>
      <ul className="local-jobs">
        {shown.map((job) => (
          <li key={job.id}>
            <JobCard
              job={job}
              catalog={job.kind === "pull" || job.kind === "build" ? byName.get(job.target) : null}
              canAct={canAct}
              cancelling={cancel.isPending && cancel.variables === job.id}
              retrying={retry.isPending && retry.variables?.id === job.id}
              onCancel={() => cancel.mutate(job.id)}
              onRetry={() => retry.mutate(job)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The download of one model as a compact line in the model list (instead of its download button while it runs). */
export function InlineJobProgress({ job }: { job: LocalJob }) {
  const { t } = useTranslation();
  const file = currentFile(job);
  const counted = !job.steps?.length || job.progress_step === job.phase;
  const share = !counted ? null : file ? shareOf(file.layer.completed, file.layer.total) : shareOf(job.completed, job.total);
  const step = (job.steps ?? []).find((item) => item.state === "running");
  const text = step ? stepLabel(t, job, step) : t("localJobs.working");
  return (
    <div className="local-inline-progress" data-testid={`local-inline-${job.target}`}>
      <span>
        {text}
        {share !== null ? ` · ${formatPercent(share)}` : ""}
      </span>
      <ProgressBar share={share} label={`${jobTitle(t, job)}: ${text}`} />
    </div>
  );
}
