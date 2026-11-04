// This computer and local models (ST-046): the detected hardware, the model server's context window, the runtime's
// advice (small context, CPU only, memory, slow or too large models) and whether a model suits this hardware.
// Speeds are only ever measured ones ("Measure speed"); nothing here estimates how fast a model will be.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cpu, Gauge } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import {
  type CatalogModel,
  type Hardware,
  type InstalledModel,
  type LocalAdvice,
  type LocalJob,
  type LocalOverview,
  localApi,
  localKeys,
  useLocalJobs,
  useLocalModels,
} from "../api/localModels";
import { toast } from "../components/toast";
import { Badge, Button, Callout, HelpTip } from "../components/ui";
import i18n from "../i18n";
import { formatLargeBytes } from "../lib/format";

const GB = 1_000_000_000;

/** How a catalog model runs here; mirrors nodestro_runtime.local_models.fits (GPU memory, else RAM if CPU-friendly). */
export type ModelFit = "gpu" | "cpu" | "too_slow" | "too_large";

export function modelFit(model: Pick<CatalogModel, "memory_bytes" | "cpu_friendly">, hardware: Hardware): ModelFit {
  if (hardware.gpu_memory_bytes !== null && hardware.gpu_memory_bytes >= model.memory_bytes) return "gpu";
  // Unknown RAM: the runtime assumes a common 16 GB computer.
  const ram = hardware.ram_bytes ?? 16 * GB;
  if (ram < model.memory_bytes) return "too_large";
  return model.cpu_friendly ? "cpu" : "too_slow";
}

/**
 * The fit from the runtime's verdict (CatalogEntry.fits) when the API sends it, the browser copy otherwise; the
 * advice local.model_too_large always wins (it knows more, e.g. the free memory). Without the hardware (a server's
 * tenants) only the runtime's verdict is known: "cpu" stands for "runs there", "too_large" for "does not"; null when
 * there is no verdict either.
 */
export function catalogFit(model: CatalogModel, overview: Pick<LocalOverview, "hardware" | "advice">): ModelFit | null {
  const tooLarge = (overview.advice ?? []).some((item) => item.code === "local.model_too_large" && sameModel(item.model, model.name));
  if (tooLarge) return "too_large";
  if (!overview.hardware) return model.fits === undefined ? null : model.fits ? "cpu" : "too_large";
  const computed = modelFit(model, overview.hardware);
  if (model.fits === undefined) return computed;
  if (model.fits) return computed === "gpu" ? "gpu" : "cpu";
  // Does not run here: too slow on a CPU when it would fit the memory, too large otherwise.
  return computed === "too_slow" ? "too_slow" : "too_large";
}

const FIT_TONE = { gpu: "success", cpu: "running", too_slow: "warning", too_large: "danger" } as const;

function sameModel(a: string | null | undefined, b: string): boolean {
  return Boolean(a) && a!.replace(/^ollama:/, "") === b.replace(/^ollama:/, "");
}

const number = (value: number) => value.toLocaleString(i18n.language);

/** Memory in GB (decimal, as the catalog states memory needs); small values as formatBytes does. */
export const formatMemory = formatLargeBytes;

/** Measured tokens per second, with one decimal. */
export function formatSpeed(value: number): string {
  return value.toLocaleString(i18n.language, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

/** The label of a fit: on this computer, or on the server when its hardware is not shown (hardware null). */
export function fitLabel(t: TFunction, fit: ModelFit, hardware: Hardware | null): string {
  if (!hardware) return t(`localModels.fit.server.${fit === "gpu" || fit === "cpu" ? "fits" : "no"}`);
  return t(`localModels.fit.${fit === "cpu" && hardware.gpu === "none" ? "cpuOnly" : fit}`);
}

export function FitBadge({ fit, hardware }: { fit: ModelFit; hardware: Hardware | null }) {
  const { t } = useTranslation();
  return <Badge tone={FIT_TONE[fit]}>{fitLabel(t, fit, hardware)}</Badge>;
}

/** The sentence of one piece of advice (with the server's own context hint for an external Ollama). */
export function adviceText(t: TFunction, item: LocalAdvice, overview: Pick<LocalOverview, "status">): string {
  const model = item.model?.replace(/^ollama:/, "") ?? "";
  switch (item.code) {
    case "local.context_small": {
      const values = { tokens: number(item.value ?? 0), recommended: number(item.recommended ?? 32768), raw: item.recommended ?? 32768 };
      const fix = overview.status.mode === "external" ? "external" : overview.status.mode === "managed" ? "managed" : "other";
      return `${t("localModels.advice.context_small", values)} ${t(`localModels.advice.context_fix.${fix}`, values)}`;
    }
    case "local.context_unknown":
      return t("localModels.advice.context_unknown");
    case "local.cpu_only":
      return t("localModels.advice.cpu_only");
    case "local.reasoning_saving":
      return t("localModels.advice.reasoning_saving");
    case "local.model_slow":
      return t("localModels.advice.model_slow", { model, speed: formatSpeed((item.value ?? 0) / 10) });
    case "local.model_too_large":
      return t("localModels.advice.model_too_large", { model, size: item.value ? formatMemory(item.value) : "–" });
    case "local.memory_low":
      return t("localModels.advice.memory_low", {
        memory: item.value ? formatMemory(item.value) : "–",
        recommended: item.recommended ? formatMemory(item.recommended) : "–",
      });
    default:
      return t("localModels.advice.other", { code: item.code });
  }
}

export function AdviceList({ overview }: { overview: LocalOverview }) {
  const { t } = useTranslation();
  const advice = overview.advice ?? [];
  if (!advice.length) return null;
  const ordered = [...advice].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "warning" ? -1 : 1));
  return (
    <div className="stack" data-testid="local-advice">
      {ordered.map((item, index) => (
        <Callout key={`${item.code}:${item.model ?? ""}:${index}`} tone={item.severity === "warning" ? "warning" : "info"}>
          <span data-testid={`local-advice-${item.code.replace(/^local\./, "")}`}>
            {adviceText(t, item, overview)}
          </span>
        </Callout>
      ))}
    </div>
  );
}

function contextLine(t: TFunction, overview: LocalOverview): string | null {
  const { status } = overview;
  if (status.context_source === undefined && status.context_length === undefined) return null;
  if (!status.context_length) return t("localModels.machine.contextUnknown");
  return t(`localModels.machine.context.${status.context_source ?? "server"}`, { tokens: number(status.context_length) });
}

/**
 * The detected hardware and what the model server reports about itself. A server's tenants do not see the server's
 * machine (hardware null): then only the model server's state and context window, and why the rest is missing.
 */
export function MachinePanel({ overview }: { overview: LocalOverview }) {
  const { t } = useTranslation();
  const { hardware, status } = overview;
  const gpu = hardware ? t(`localModels.gpu.${hardware.gpu}`) : "";
  const title = hardware ? t("localModels.machine.title") : t("localModels.machine.serverTitle");
  const context = contextLine(t, overview);
  const runtime = status.mode === "unavailable"
    ? t("localModels.machine.runtime.none")
    : status.running
      ? t("localModels.machine.runtime.running", { version: status.version ?? "–" })
      : status.mode === "managed" && !status.runtime_installed
        ? t("localModels.machine.runtime.missing", { version: status.pinned_version })
        : t("localModels.machine.runtime.stopped");
  const accelerated =
    status.accelerated === undefined ? null : t(`localModels.machine.accelerated.${status.accelerated === null ? "unknown" : String(status.accelerated)}`);
  return (
    <div className="stack" data-testid="local-hardware">
      <h3 className="small">
        <Cpu size={13} aria-hidden /> {title} <HelpTip id="settings.localHardware" label={title} />
      </h3>
      {hardware ? null : (
        <p className="muted small" data-testid="local-hardware-hidden">
          {t("localModels.machine.hidden")}
        </p>
      )}
      <dl className="form-values">
        {hardware ? (
          <>
            <div>
              <dt>{t("localModels.machine.system")}</dt>
              <dd>
                {hardware.system} · {hardware.machine}
              </dd>
            </div>
            <div>
              <dt>{t("localModels.machine.cpus")}</dt>
              <dd>{hardware.cpus}</dd>
            </div>
            <div>
              <dt>{t("localModels.machine.memory")}</dt>
              <dd>{hardware.ram_bytes ? formatMemory(hardware.ram_bytes) : t("localModels.machine.unknown")}</dd>
            </div>
            <div>
              <dt>{t("localModels.machine.gpu")}</dt>
              <dd>
                {hardware.gpu_memory_bytes ? t("localModels.machine.gpuMemory", { gpu, memory: formatMemory(hardware.gpu_memory_bytes) }) : gpu}
              </dd>
            </div>
          </>
        ) : null}
        <div>
          <dt>{t("localModels.machine.server")}</dt>
          <dd data-testid="local-runtime-state">
            {runtime}
            {accelerated ? ` · ${accelerated}` : ""}
          </dd>
        </div>
        {context ? (
          <div>
            <dt>{t("localModels.machine.contextTitle")}</dt>
            <dd data-testid="local-context">{context}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

/** The newest speed measurement job of a model. */
function latestBenchmark(jobs: LocalJob[] | undefined, model: string): LocalJob | undefined {
  return (jobs ?? []).filter((job) => job.kind === "benchmark" && job.target === model).at(-1);
}

/** The measured speed of an installed chat model and the button that measures it. */
export function SpeedCell({ model, canMeasure }: { model: InstalledModel; canMeasure: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const jobs = useLocalJobs(canMeasure);
  const job = latestBenchmark(jobs.data, model.name);
  const measure = useMutation({
    mutationFn: () => localApi.benchmark(model.name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: localKeys.jobs });
      toast.info(t("localModels.speed.started", { model: model.name }));
    },
    onError: toast.error,
  });
  if (model.kind !== "chat") return null;
  const speed = model.speed;
  const running = job?.state === "running";
  return (
    <div className="stack-sm small" data-testid={`local-speed-${model.name}`}>
      {speed ? (
        <span>
          {t("localModels.speed.value", { speed: formatSpeed(speed.tokens_per_second) })}
          {speed.processor ? ` · ${t(`localModels.speed.processor.${speed.processor}`)}` : ""}
          {speed.prompt_tokens_per_second
            ? ` · ${t("localModels.speed.prompt", { speed: formatSpeed(speed.prompt_tokens_per_second) })}`
            : ""}
          <span className="muted">
            {" "}
            · {t("localModels.speed.measuredAt", { date: new Date(speed.measured_at).toLocaleDateString(i18n.language) })}
            {speed.context_length ? ` · ${t("localModels.speed.context", { tokens: number(speed.context_length) })}` : ""}
          </span>
        </span>
      ) : (
        <span className="muted">{t("localModels.speed.notMeasured")}</span>
      )}
      <div>
        <Button size="sm" variant="ghost" icon={Gauge} disabled={!canMeasure || running} busy={measure.isPending || running} onClick={() => measure.mutate()}>
          {speed ? t("localModels.speed.again") : t("localModels.speed.measure")}
        </Button>
      </div>
    </div>
  );
}

/**
 * A short note for a local model where one is chosen (the model picker): how it runs on this computer and its
 * measured speed. Undefined for other providers and while nothing is known.
 */
export function useLocalModelNote(model: string): string | undefined {
  const { t } = useTranslation();
  const local = model.startsWith("ollama:");
  const overview = useLocalModels(local);
  const data = overview.data;
  if (!local || !data?.catalog) return undefined;
  const name = model.slice("ollama:".length);
  const parts: string[] = [];
  const entry = data.catalog.find((item) => item.name === name);
  const fit = entry ? catalogFit(entry, data) : null;
  if (fit) parts.push(fitLabel(t, fit, data.hardware ?? null));
  const installed = data.status?.models?.find((item) => item.name === name);
  if (installed?.speed) parts.push(t("localModels.speed.value", { speed: formatSpeed(installed.speed.tokens_per_second) }));
  const slow = (data.advice ?? []).find((item) => item.code === "local.model_slow" && sameModel(item.model, name));
  if (slow) parts.push(t("localModels.fit.slowHint"));
  return parts.length ? parts.join(" · ") : undefined;
}
