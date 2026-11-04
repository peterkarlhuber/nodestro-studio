// The parts of the export dialog for a ready-to-run (portable) package: target platform, local models, offline
// operation and result folder, the summary of what the package contains and needs, and the background build with
// its progress. The package itself is built by the backend (nodestro_api.portable_build) as a job.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, PackageOpen, WifiOff, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import type { ExportJob, ExportOptions, PortableCheck } from "../api/types";
import { ProgressBar } from "../automation/shared";
import { toast } from "../components/toast";
import {
  Badge,
  Button,
  Callout,
  Field,
  Section,
  Select,
  TextInput,
  Toggle,
} from "../components/ui";
import { providerLabel } from "../components/ModelPicker";
import { problemText } from "../lib/errors";
import { formatDate, formatLargeBytes } from "../lib/format";

export function PortableOptions({
  options,
  setOptions,
  portable,
}: {
  options: ExportOptions;
  setOptions: (options: ExportOptions) => void;
  portable: PortableCheck | null | undefined;
}) {
  const { t } = useTranslation();
  const unknownLicense = (portable?.local_models ?? []).some(
    (item) => item.redistribution !== "permitted",
  );
  const platforms = portable?.platforms ?? [];
  return (
    <div className="stack-sm" data-testid="api-export-portable">
      <div className="grid-2">
        <Field
          label={t("publish.export.portable.platform")}
          hint={t("publish.export.portable.platformHint")}
        >
          <Select
            value={options.platform ?? portable?.platform ?? ""}
            placeholder={platforms.length ? undefined : t("common.loading")}
            onChange={(platform) =>
              setOptions({ ...options, platform: platform || null })
            }
            options={platforms.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
        </Field>
        <Field
          label={t("publish.export.portable.outputDir")}
          hint={t("publish.export.portable.outputDirHint")}
        >
          <TextInput
            value={options.output_dir}
            placeholder="results"
            maxLength={500}
            spellCheck={false}
            onChange={(event) =>
              setOptions({ ...options, output_dir: event.target.value })
            }
            data-testid="api-export-output-dir"
          />
        </Field>
      </div>
      <Toggle
        checked={options.local_models}
        // Offline needs the models in the package: the offline switch turns this on and keeps it on.
        disabled={options.offline}
        onChange={(local_models) => setOptions({ ...options, local_models })}
        label={t("publish.export.portable.localModels")}
        description={t("publish.export.portable.localModelsHint")}
      />
      <Toggle
        checked={options.offline}
        onChange={(offline) =>
          setOptions({
            ...options,
            offline,
            local_models: offline ? true : options.local_models,
          })
        }
        label={t("publish.export.portable.offline")}
        description={t("publish.export.portable.offlineHint")}
      />
      {unknownLicense ? (
        <label className="checkbox">
          <input
            type="checkbox"
            checked={options.confirm_models}
            onChange={(event) =>
              setOptions({ ...options, confirm_models: event.target.checked })
            }
            data-testid="api-export-confirm-models"
          />{" "}
          {t("publish.export.portable.confirmModels")}
        </label>
      ) : null}
      <label className="checkbox">
        <input
          type="checkbox"
          checked={options.confirm_distribution}
          onChange={(event) =>
            setOptions({
              ...options,
              confirm_distribution: event.target.checked,
            })
          }
          data-testid="api-export-confirm"
        />{" "}
        {t("publish.export.portable.confirmDistribution")}
      </label>
    </div>
  );
}

export function PortableSummary({
  portable,
  options,
}: {
  portable: PortableCheck;
  options: ExportOptions;
}) {
  const { t } = useTranslation();
  const platform =
    portable.platforms.find((item) => item.id === portable.platform)?.label ??
    portable.platform;
  const modelBytes = portable.local_models
    .filter((item) => portable.bundled_models.includes(item.name))
    .reduce((sum, item) => sum + item.size, 0);
  return (
    <Section title={t("publish.export.portable.summary")} icon={PackageOpen} defaultOpen>
      <div className="stack-sm" data-testid="api-export-summary">
        <p className="small">
          {t("publish.export.portable.summaryLine", {
            platform,
            size: formatLargeBytes(portable.estimated_bytes),
          })}{" "}
          {portable.offline_capable ? (
            <Badge tone="success" icon={WifiOff}>
              {t("publish.export.portable.offlineCapable")}
            </Badge>
          ) : (
            <Badge tone="warning">
              {t("publish.export.portable.needsNetwork")}
            </Badge>
          )}
        </p>
        <p className="small muted">
          {t(
            options.web_ui
              ? "publish.export.portable.withUi"
              : "publish.export.portable.withoutUi",
          )}{" "}
          {t("publish.export.portable.noInstall")}
        </p>
        {portable.local_models.length ? (
          <div className="table-wrap">
            <table className="table small">
              <caption className="visually-hidden">
                {t("publish.export.portable.models")}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("publish.export.portable.model")}</th>
                  <th scope="col">{t("publish.export.portable.usedAs")}</th>
                  <th scope="col">{t("publish.export.portable.size")}</th>
                  <th scope="col">{t("publish.export.portable.memory")}</th>
                  <th scope="col">{t("publish.export.portable.license")}</th>
                  <th scope="col">{t("publish.export.portable.state")}</th>
                </tr>
              </thead>
              <tbody>
                {portable.local_models.map((item) => (
                  <tr key={item.name}>
                    <td>
                      <code>{item.name}</code>
                      {item.capabilities.length ? (
                        <div className="muted">
                          {item.capabilities.join(", ")}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {item.roles
                        .map((role) =>
                          t(`publish.export.portable.role.${role}`),
                        )
                        .join(", ")}
                    </td>
                    <td>{item.size ? formatLargeBytes(item.size) : "–"}</td>
                    <td>
                      {item.memory_bytes ? formatLargeBytes(item.memory_bytes) : "–"}
                    </td>
                    <td>
                      {item.license ??
                        t("publish.export.portable.licenseUnknown")}
                      {item.redistribution !== "permitted" ? (
                        <div className="muted">
                          {t("publish.export.portable.licenseConfirm")}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {!item.installed ? (
                        <Badge tone="danger">
                          {t("publish.export.portable.missing")}
                        </Badge>
                      ) : portable.bundled_models.includes(item.name) ? (
                        <Badge tone="success" icon={CheckCircle2}>
                          {t("publish.export.portable.included")}
                        </Badge>
                      ) : (
                        <Badge>
                          {t("publish.export.portable.notIncluded")}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="small muted">
            {t("publish.export.portable.noLocalModels")}
          </p>
        )}
        {modelBytes ? (
          <p className="small muted">
            {t("publish.export.portable.modelsTotal", {
              size: formatLargeBytes(modelBytes),
              memory: portable.memory_bytes
                ? formatLargeBytes(portable.memory_bytes)
                : "–",
            })}
          </p>
        ) : null}
        {portable.providers.filter((item) => item !== "ollama").length ? (
          <p className="small">
            {t("publish.export.portable.providers", {
              providers: portable.providers
                .filter((item) => item !== "ollama")
                .map((item) => providerLabel(t, item))
                .join(", "),
            })}
          </p>
        ) : null}
        {portable.network_needs.length ? (
          <div className="stack-sm">
            <p className="small">{t("publish.export.portable.network")}</p>
            <ul className="small">
              {portable.network_needs.map((need) => (
                <li key={`${need.kind}:${need.name}`}>
                  {t(`publish.export.portable.need.${need.kind}`, {
                    name: need.name,
                    detail: need.detail,
                  })}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {portable.downloads.some((item) => !item.cached) ? (
          <p className="small muted">
            {t("publish.export.portable.downloads", {
              items: portable.downloads
                .filter((item) => !item.cached)
                .map((item) =>
                  t(`publish.export.portable.download.${item.what}`),
                )
                .join(", "),
            })}
          </p>
        ) : null}
      </div>
    </Section>
  );
}

const ACTIVE = 2000;

export function useExportJobs(publicationId: string) {
  return useQuery({
    queryKey: ["api", "export-jobs", publicationId],
    queryFn: () => api.exportJobs(publicationId),
    refetchInterval: (query) =>
      (query.state.data ?? []).some((job) => job.state === "running")
        ? ACTIVE
        : false,
  });
}

export function ExportJobs({
  publicationId,
  onDone,
}: {
  publicationId: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const jobs = useExportJobs(publicationId);
  const cancel = useMutation({
    mutationFn: (job: ExportJob) => api.cancelExportJob(job.id),
    onSuccess: () =>
      void client.invalidateQueries({
        queryKey: ["api", "export-jobs", publicationId],
      }),
    onError: (error) => toast.error(error),
  });
  const recent = (jobs.data ?? []).slice(0, 3);
  if (!recent.length) return null;
  return (
    <section
      className="stack-sm"
      aria-live="polite"
      data-testid="api-export-jobs"
    >
      <h3 className="api-heading">{t("publish.export.portable.jobs")}</h3>
      {recent.map((job) => (
        <JobRow
          key={job.id}
          job={job}
          onCancel={() => cancel.mutate(job)}
          cancelling={cancel.isPending}
          onDone={onDone}
        />
      ))}
    </section>
  );
}

function JobRow({
  job,
  onCancel,
  cancelling,
  onDone,
}: {
  job: ExportJob;
  onCancel: () => void;
  cancelling: boolean;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const step = t(`publish.export.portable.step.${job.step}`, {
    defaultValue: job.step,
  });
  if (job.state === "done" && job.export_id) {
    return (
      <Callout tone="brand">
        <span className="row-gap">
          <CheckCircle2 size={14} aria-hidden />{" "}
          {t("publish.export.portable.done", {
            date: formatDate(job.finished_at ?? job.created_at),
          })}{" "}
          <a
            href={api.exportUrl(job.export_id)}
            onClick={onDone}
            data-testid="api-export-job-download"
          >
            <Download size={13} aria-hidden />{" "}
            {t("publish.export.portable.downloadZip")}
          </a>
        </span>
      </Callout>
    );
  }
  if (job.state === "failed" || job.state === "cancelled") {
    return (
      <Callout tone={job.state === "failed" ? "danger" : "info"}>
        {job.state === "failed"
          ? problemText(t, {
              code: job.error_code ?? "export.failed",
              message: job.error ?? "",
            })
          : t("publish.export.portable.cancelled")}
      </Callout>
    );
  }
  return (
    <div className="stack-sm" data-testid="api-export-job-running">
      <div className="row-gap">
        <span className="small">
          {t("publish.export.portable.running", {
            step,
            percent: Math.round(job.progress * 100),
          })}
          {job.message ? <span className="muted"> · {job.message}</span> : null}
        </span>
        <Button
          size="sm"
          variant="ghost"
          icon={X}
          busy={cancelling}
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
      </div>
      <ProgressBar
        value={job.progress}
        label={t("publish.export.portable.progress")}
      />
      {job.bytes_total ? (
        <span className="muted small">
          {formatLargeBytes(job.bytes_done)} / {formatLargeBytes(job.bytes_total)}
        </span>
      ) : null}
    </div>
  );
}
