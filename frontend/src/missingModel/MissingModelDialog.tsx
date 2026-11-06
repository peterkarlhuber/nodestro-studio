// "Required model not installed": one dialog for every action that needs a local model which is not ready. It says
// what is missing, why the action needs it, what can be done now (only what the server allows for this cause,
// operating mode and permission) and how the action continues; it drives the existing download and setup jobs
// (pages/LocalModelJobs.tsx) and lets the action continue once the model was checked, or with another ready model.

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Copy, Download, RefreshCw, Settings2, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ApiError } from "../api/client";
import { type LocalJob, localApi, useLocalJobs } from "../api/localModels";
import { type ModelAlternative, type ModelProblem, type Readiness, type ReadinessAction, readinessApi } from "../api/modelReadiness";
import { LiveAnnouncer } from "../components/Progress";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Modal, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatLargeBytes, formatTokens } from "../lib/format";
import { useSettingsHref } from "../lib/settingsLink";
import { JobCard, useLocalRefresh } from "../pages/LocalModelJobs";
import { type MissingModelRequest, useMissingModel } from "./store";

type Stage = "problem" | "choose" | "job" | "checking" | "ready";

/** The model's name as people read it (``qwen3.5:9b``, without the provider prefix). */
export function shownModel(model: string): string {
  return model.replace(/^ollama:/, "");
}

/** The job this dialog follows: from the job list while it is there, else the answer that started it. */
function useFollowedJob(jobId: string | null, started: LocalJob | null): LocalJob | null {
  const jobs = useLocalJobs(jobId !== null);
  if (!jobId) return null;
  return jobs.data?.find((job) => job.id === jobId) ?? (started?.id === jobId ? started : null);
}

/** Starting a setup that runs already answers local.job_running with the running job's id: that one is followed. */
async function startSetup(): Promise<LocalJob> {
  try {
    return await localApi.setup({ download: true });
  } catch (error) {
    if (error instanceof ApiError && error.code === "local.job_running" && typeof error.params.job === "string")
      return localApi.jobs().then((jobs) => jobs.find((job) => job.id === error.params.job) ?? Promise.reject(error));
    throw error;
  }
}

export function MissingModelHost() {
  const request = useMissingModel((state) => state.request);
  if (!request) return null;
  return <MissingModelDialog key={request.id} request={request} />;
}

export function MissingModelDialog({ request }: { request: MissingModelRequest }) {
  const { t } = useTranslation();
  const finish = useMissingModel((state) => state.finish);
  const refresh = useLocalRefresh();
  const [readiness, setReadiness] = useState<Readiness>(request.readiness);
  const problem = readiness.problem;
  const running = problem?.job?.state === "running" ? problem.job : null;
  const [stage, setStage] = useState<Stage>(running ? "job" : "problem");
  const [jobId, setJobId] = useState<string | null>(running?.id ?? null);
  const [started, setStarted] = useState<LocalJob | null>(running);
  const [auto, setAuto] = useState(false);
  const [chosen, setChosen] = useState<string>(readiness.alternatives[0]?.model ?? "");
  const [checkError, setCheckError] = useState<unknown>(null);
  const job = useFollowedJob(jobId, started);
  const model = request.readiness.model;
  const name = shownModel(model);
  const done = (resolution: { model: string; switched: boolean } | null) => finish(request.id, resolution);
  const settingsHref = useSettingsHref("settings-local-models");

  const check = useMutation({
    mutationFn: () => readinessApi.check(model, request.action, request.capabilities),
    onMutate: () => setCheckError(null),
    onSuccess: (found) => {
      refresh();
      if (found.ready) {
        setStage("ready");
        return;
      }
      setReadiness(found);
      const now = found.problem?.job?.state === "running" ? found.problem.job : null;
      setJobId(now?.id ?? null);
      setStarted(now);
      setStage(now ? "job" : "problem");
    },
    onError: setCheckError,
  });

  const begin = useMutation({
    mutationFn: (kind: "download" | "setup") => (kind === "download" ? readinessApi.download(model) : startSetup()),
    onSuccess: (found) => {
      setStarted(found);
      setJobId(found.id);
      setStage("job");
      refresh();
    },
    onError: (error) => toast.error(error),
  });
  const cancelJob = useMutation({ mutationFn: localApi.cancelJob, onSuccess: refresh, onError: toast.error });

  // A finished job is checked once: the model must really be there (and able to do the action) before anything
  // continues. A setup ends with the server running; the model itself is downloaded next.
  const checkedJob = useRef<string | null>(null);
  useEffect(() => {
    if (!job || job.state !== "done" || checkedJob.current === job.id) return;
    checkedJob.current = job.id;
    setStage("checking");
    check.mutate();
    // Only when the followed job ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, job?.state]);

  // The opt-in automatic continuation: once, only after the check said the model is ready.
  const continued = useRef(false);
  useEffect(() => {
    if (stage !== "ready" || !auto || request.fixOnly || continued.current) return;
    continued.current = true;
    done({ model, switched: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, auto]);

  const title = stage === "ready" ? t("missingModel.ready.title") : t(`missingModel.title.${problem?.cause ?? "model_missing"}`);
  const actionLabel = t(`missingModel.continueTo.${request.action}`);
  const busy = begin.isPending || check.isPending;

  const footer = (
    <>
      <Button variant="ghost" onClick={() => done(null)} data-testid="missing-model-cancel">
        {stage === "job" && job?.state === "running" ? t("missingModel.actions.close") : t("common.cancel")}
      </Button>
      {stage === "ready" ? (
        <Button
          variant="primary"
          icon={CheckCircle2}
          data-testid="missing-model-continue"
          onClick={() => {
            if (continued.current) return;
            continued.current = true;
            done({ model, switched: false });
          }}
        >
          {request.fixOnly ? t("missingModel.actions.done") : t("missingModel.actions.continue")}
        </Button>
      ) : stage === "choose" ? (
        <>
          <Button onClick={() => setStage("problem")}>{t("missingModel.choose.back")}</Button>
          <Button
            variant="primary"
            disabled={!chosen}
            data-testid="missing-model-use"
            onClick={() => {
              if (continued.current) return;
              continued.current = true;
              done({ model: chosen, switched: true });
            }}
          >
            {t("missingModel.actions.useModel")}
          </Button>
        </>
      ) : null}
    </>
  );

  return (
    <Modal title={title} open onClose={() => done(null)} footer={footer} wide>
      <div className="missing-model stack" data-testid="missing-model" data-cause={problem?.cause} data-stage={stage}>
        {stage === "ready" ? (
          <ReadyText name={name} fixOnly={request.fixOnly} action={actionLabel} />
        ) : stage === "checking" ? (
          <Spinner label={t("missingModel.job.checking")} />
        ) : stage === "choose" ? (
          <ChooseModel
            alternatives={readiness.alternatives}
            chosen={chosen}
            onChoose={setChosen}
            action={request.action}
          />
        ) : problem ? (
          <>
            <ProblemFacts problem={problem} name={name} action={request.action} fixOnly={request.fixOnly} />
            {stage === "job" && job ? (
              <div className="stack-sm" data-testid="missing-model-job">
                {running && job.id === running.id ? <p className="small muted">{t("missingModel.job.already")}</p> : null}
                <JobCard
                  job={job}
                  canAct
                  cancelling={cancelJob.isPending}
                  retrying={begin.isPending}
                  onCancel={() => cancelJob.mutate(job.id)}
                  onRetry={() => begin.mutate(job.kind === "pull" || job.kind === "build" ? "download" : "setup")}
                />
                {job.state === "running" ? <p className="small muted">{t("missingModel.job.background")}</p> : null}
                {!request.fixOnly && job.state === "running" ? (
                  <label className="missing-model__auto">
                    <input type="checkbox" checked={auto} onChange={(event) => setAuto(event.target.checked)} data-testid="missing-model-auto" />
                    <span>
                      {t("missingModel.job.auto")}
                      <small className="muted">{t("missingModel.job.autoHint", { action: actionLabel })}</small>
                    </span>
                  </label>
                ) : null}
              </div>
            ) : null}
            {checkError ? (
              <Callout tone="danger">
                <ErrorText error={checkError} />
              </Callout>
            ) : null}
            {stage === "problem" ? (
              <div className="missing-model__actions" role="group" aria-label={t("missingModel.actionsLabel")}>
                {problem.actions.includes("download") ? (
                  <Button
                    variant="primary"
                    icon={Download}
                    busy={begin.isPending}
                    disabled={busy}
                    data-testid="missing-model-download"
                    onClick={() => begin.mutate("download")}
                  >
                    {problem.cause === "hardware_insufficient"
                      ? t("missingModel.actions.downloadAnyway")
                      : problem.previous_job
                        ? t("missingModel.actions.resume")
                        : t("missingModel.actions.download")}
                  </Button>
                ) : null}
                {problem.actions.includes("setup_server") ? (
                  <Button
                    variant="primary"
                    icon={Wrench}
                    busy={begin.isPending}
                    disabled={busy}
                    data-testid="missing-model-setup"
                    onClick={() => begin.mutate("setup")}
                  >
                    {t("missingModel.actions.setup")}
                  </Button>
                ) : null}
                {problem.actions.includes("retry") ? (
                  <Button icon={RefreshCw} busy={check.isPending} disabled={busy} data-testid="missing-model-retry" onClick={() => check.mutate()}>
                    {t("missingModel.actions.retry")}
                  </Button>
                ) : null}
                {problem.actions.includes("choose_model") && readiness.alternatives.length ? (
                  <Button disabled={busy} data-testid="missing-model-choose" onClick={() => setStage("choose")}>
                    {t("missingModel.actions.choose")}
                  </Button>
                ) : null}
                {problem.actions.includes("ask_admin") ? (
                  <Button
                    icon={Copy}
                    data-testid="missing-model-copy"
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(name)
                        .then(() => toast.success(t("missingModel.askAdmin.copied")))
                        .catch(() => undefined);
                    }}
                  >
                    {t("missingModel.actions.copyName")}
                  </Button>
                ) : null}
                {problem.actions.includes("open_settings") ? (
                  <Link className="nd-button nd-button--default nd-button--md" to={settingsHref} onClick={() => done(null)} data-testid="missing-model-settings">
                    <Settings2 size={15} aria-hidden /> {t("missingModel.actions.openSettings")}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
        <LiveAnnouncer message={stage === "ready" ? t("missingModel.ready.title") : title} />
      </div>
    </Modal>
  );
}

function ReadyText({ name, fixOnly, action }: { name: string; fixOnly: boolean; action: string }) {
  const { t } = useTranslation();
  return (
    <Callout tone="brand">
      <span data-testid="missing-model-ready">
        {fixOnly ? t("missingModel.ready.fix", { model: name }) : t("missingModel.ready.text", { model: name, action })}
      </span>
    </Callout>
  );
}

/** What is missing, where, why the action needs it, what it takes (size, space, memory) and how it continues. */
function ProblemFacts({ problem, name, action, fixOnly }: { problem: ModelProblem; name: string; action: ReadinessAction; fixOnly: boolean }) {
  const { t } = useTranslation();
  const where = problem.location;
  const values = {
    model: name,
    host: problem.host ?? "",
    size: problem.download_bytes ? formatLargeBytes(problem.download_bytes) : "",
    free: problem.free_bytes !== null ? formatLargeBytes(problem.free_bytes) : "",
    list: problem.missing_capabilities.map((item) => t(`missingModel.capability.${item}`, { defaultValue: item })).join(", "),
  };
  const facts: string[] = [];
  if (problem.download_bytes && ["model_missing", "hardware_insufficient", "disk_full", "runtime_missing"].includes(problem.cause))
    facts.push(t("missingModel.facts.size", values));
  else if (problem.cause === "model_missing") facts.push(t("missingModel.facts.sizeUnknown"));
  if (problem.free_bytes !== null && problem.cause !== "runtime_missing") facts.push(t("missingModel.facts.free", values));
  if (problem.memory_bytes && problem.fits !== null) facts.push(t("missingModel.facts.memory", { memory: formatLargeBytes(problem.memory_bytes) }));
  if (problem.partial_bytes && problem.previous_job) facts.push(t("missingModel.facts.partial", { size: formatLargeBytes(problem.partial_bytes) }));
  return (
    <div className="stack-sm">
      <p className="missing-model__lead" data-testid="missing-model-cause">
        {t(`missingModel.cause.${problem.cause}.${where}`, { ...values, defaultValue: t(`missingModel.cause.${problem.cause}.this_computer`, values) })}
      </p>
      <p className="small">
        <code className="missing-model__name">{name}</code>
        {problem.catalog ? (
          <>
            {" "}
            <Badge tone="idle">{t("missingModel.catalog")}</Badge>
          </>
        ) : null}
      </p>
      {facts.length ? (
        <ul className="missing-model__facts small" data-testid="missing-model-facts">
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      ) : null}
      {problem.fits === false ? <Callout tone="warning">{t("missingModel.facts.fitsNo")}</Callout> : null}
      {problem.blocked ? (
        <Callout tone={problem.blocked === "offline" ? "info" : "warning"}>
          <span data-testid="missing-model-blocked">{t(`missingModel.blocked.${problem.blocked}`, values)}</span>
        </Callout>
      ) : null}
      {problem.cause !== "model_name_invalid" ? <p className="small muted">{t(`missingModel.why.${action}`)}</p> : null}
      {!fixOnly && problem.actions.some((item) => item === "download" || item === "setup_server") ? (
        <p className="small muted" data-testid="missing-model-keep">
          {t(`missingModel.keep.${action}`)}
        </p>
      ) : null}
    </div>
  );
}

function ChooseModel({
  alternatives,
  chosen,
  onChoose,
  action,
}: {
  alternatives: ModelAlternative[];
  chosen: string;
  onChoose: (model: string) => void;
  action: ReadinessAction;
}) {
  const { t } = useTranslation();
  return (
    <fieldset className="missing-model__choose stack-sm" data-testid="missing-model-alternatives">
      <legend>{t("missingModel.choose.title")}</legend>
      <p className="small muted">{t(action === "agent_test" ? "missingModel.choose.noteAgent" : "missingModel.choose.note")}</p>
      <ul>
        {alternatives.map((item) => (
          <li key={item.model}>
            <label className="missing-model__option">
              <input type="radio" name="missing-model-alternative" value={item.model} checked={chosen === item.model} onChange={() => onChoose(item.model)} />
              <span className="missing-model__option-text">
                <span>
                  <code>{shownModel(item.model)}</code>{" "}
                  <Badge tone={item.local ? "success" : "idle"}>{item.local ? t("missingModel.choose.local") : t("missingModel.choose.cloud")}</Badge>
                </span>
                {item.context_window ? (
                  <small className="muted">{t("missingModel.choose.context", { tokens: formatTokens(item.context_window) })}</small>
                ) : null}
                {item.limited ? <small className="muted">{t("missingModel.choose.limited")}</small> : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
