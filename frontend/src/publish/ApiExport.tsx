// Generate a standalone FastAPI project from a published version: options, what goes in and what
// stays out, the generated ZIP and the export history. An AI-written guide is optional and only
// written on request (it costs one request and has to be reviewed before it can be included).

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, PackageOpen, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { api } from "../api/client";
import type {
  ApiGuide,
  ApiOverview,
  ExportCheck,
  ExportLanguage,
  ExportOptions,
  Publication,
} from "../api/types";
import { toast } from "../components/toast";
import { Output } from "../components/Markdown";
import {
  Badge,
  Button,
  Callout,
  ConfirmIconButton,
  Field,
  Hint,
  Section,
  Segmented,
  Select,
  Spinner,
  Toggle,
} from "../components/ui";
import { currentLanguage, LANGUAGE_NAMES, LANGUAGES } from "../i18n";
import { ErrorText } from "../lib/errors";
import { formatBytes, formatCost, formatDate } from "../lib/format";
import { useDebounced } from "../lib/useDebounced";
import { Problems } from "./common";
import { ExportJobs, PortableOptions, PortableSummary } from "./PortableExport";

const DEFAULTS: ExportOptions = {
  kind: "standard",
  orkexa: "git",
  confirm_distribution: false,
  knowledge: [],
  memory: [],
  language: "en",
  guide_id: null,
  web_ui: false,
  platform: null,
  local_models: true,
  offline: false,
  confirm_models: false,
  allow_downloads: true,
  output_dir: "",
};

export function ApiExport({
  overview,
  publication,
  onChanged,
}: {
  overview: ApiOverview;
  publication: Publication;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [number, setNumber] = useState<number | null>(null);
  // The README and the interface start in the studio's language; the person can choose another one.
  const [options, setOptions] = useState<ExportOptions>({
    ...DEFAULTS,
    language: currentLanguage() as ExportLanguage,
  });
  const portable = options.kind === "portable";
  const queryClient = useQueryClient();
  // The check takes seconds (it assembles the whole project): typing in a field asks once after a pause, and the
  // previous answer (platforms, summary) stays visible meanwhile instead of an empty form and a spinner.
  const checked = useDebounced(options, 400);
  const check = useQuery({
    queryKey: ["api", "export-check", publication.id, number, checked],
    queryFn: () => api.exportCheck(publication.id, checked, number),
    placeholderData: keepPreviousData,
  });
  // The answer shown belongs to other options until the new check is back: nothing is built from it.
  const current = checked === options && !check.isPlaceholderData;
  const history = useQuery({
    queryKey: ["api", "exports", publication.id],
    queryFn: () => api.exports(publication.id),
  });
  const guides = useQuery({
    queryKey: ["api", "guides", publication.id],
    queryFn: () => api.guides(publication.id),
  });
  const build = useMutation({
    mutationFn: () => api.startExportJob(publication.id, options, number),
    onSuccess: () => {
      toast.success(t("publish.export.portable.started"));
      void queryClient.invalidateQueries({
        queryKey: ["api", "export-jobs", publication.id],
      });
    },
    onError: (error) => toast.error(error),
  });
  const canEdit = useAccess().can("edit");
  const remove = useMutation({
    mutationFn: (exportId: string) => api.deleteExport(exportId),
    onSuccess: () => {
      toast.success(t("publish.export.deleted"));
      void history.refetch();
      // A freed quota (server) changes the check's answer.
      void queryClient.invalidateQueries({ queryKey: ["api", "export-check", publication.id] });
      onChanged();
    },
    onError: (error) => toast.error(error),
  });
  const create = useMutation({
    mutationFn: () => api.createExport(publication.id, options, number),
    onSuccess: (record) => {
      toast.success(t("publish.export.created", { name: record.file_name }));
      void history.refetch();
      onChanged();
      window.location.assign(api.exportUrl(record.id));
    },
    onError: (error) => toast.error(error),
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const writeGuide = useMutation({
    mutationFn: () =>
      api.createGuide(publication.id, currentLanguage(), number),
    onSuccess: () => void guides.refetch(),
    onError: (error) => toast.error(error),
  });
  const decide = useMutation({
    mutationFn: ({
      guide,
      decision,
    }: {
      guide: ApiGuide;
      decision: "accept" | "discard";
    }) => api.decideGuide(guide.id, decision),
    onSuccess: (result) => {
      void guides.refetch();
      if (!result && options.guide_id)
        setOptions({ ...options, guide_id: null });
    },
    onError: (error) => toast.error(error),
  });

  const toggle = (list: string[], id: string, on: boolean) =>
    on ? [...list, id] : list.filter((item) => item !== id);
  const release = number ?? publication.active_release;
  const forRelease = (guides.data ?? []).filter(
    (guide) => guide.release_number === release,
  );
  const draft = forRelease.find((guide) => !guide.accepted);
  const accepted = forRelease.filter((guide) => guide.accepted);

  return (
    <div className="stack">
      <p className="muted small">{t("publish.export.intro")}</p>
      <div className="grid-2">
        <Field label={t("publish.try.version")}>
          <Select
            value={number ? String(number) : ""}
            onChange={(value) => setNumber(value ? Number(value) : null)}
            options={[
              { value: "", label: t("publish.try.activeVersion") },
              ...overview.releases.map((item) => ({
                value: String(item.number),
                label: t("publish.versions.number", { number: item.number }),
              })),
            ]}
          />
        </Field>
        <Field
          label={t("publish.export.readme")}
          hint={t("publish.export.readmeHint")}
        >
          <Select
            value={options.language}
            onChange={(language) =>
              setOptions({ ...options, language: language as ExportLanguage })
            }
            options={LANGUAGES.map((code) => ({
              value: code,
              label: LANGUAGE_NAMES[code],
            }))}
          />
        </Field>
      </div>

      <Field label={t("publish.export.kind")}>
        <Segmented<"standard" | "portable">
          label={t("publish.export.kind")}
          value={options.kind}
          onChange={(kind) =>
            setOptions({
              ...options,
              kind,
              confirm_distribution: false,
              orkexa: kind === "portable" ? "bundle" : options.orkexa,
            })
          }
          options={[
            {
              value: "standard",
              label: t("publish.export.kindStandard"),
              testId: "api-export-kind-standard",
            },
            {
              value: "portable",
              label: t("publish.export.kindPortable"),
              testId: "api-export-kind-portable",
            },
          ]}
        />
      </Field>
      <p className="muted small">
        {portable
          ? t("publish.export.portableHint")
          : t("publish.export.standardHint")}
      </p>
      <Toggle
        checked={options.web_ui}
        onChange={(web_ui) => setOptions({ ...options, web_ui })}
        label={t("publish.export.webUi")}
        description={t("publish.export.webUiHint")}
      />
      {portable ? (
        <PortableOptions
          options={options}
          setOptions={setOptions}
          portable={check.data?.portable}
        />
      ) : null}

      {portable ? null : (
        <>
          <Field label={t("publish.export.library")} tip="publish.library">
            <Segmented<"git" | "bundle">
              label={t("publish.export.library")}
              value={options.orkexa}
              onChange={(orkexa) =>
                setOptions({ ...options, orkexa, confirm_distribution: false })
              }
              options={[
                { value: "git", label: t("publish.export.libraryGit") },
                { value: "bundle", label: t("publish.export.libraryBundle") },
              ]}
            />
          </Field>
          <p className="muted small">
            {options.orkexa === "git"
              ? t("publish.export.gitHint")
              : t("publish.export.bundleHint")}
          </p>
          {options.orkexa === "bundle" ? (
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
              {t("publish.export.confirmDistribution")}
            </label>
          ) : null}
        </>
      )}

      {check.data?.resources.length ? (
        <section className="stack-sm">
          <h3 className="api-heading">{t("publish.export.resources")}</h3>
          <p className="muted small">{t("publish.export.resourcesHint")}</p>
          {check.data.resources.map((resource) => (
            <label key={`${resource.kind}:${resource.id}`} className="checkbox">
              <input
                type="checkbox"
                disabled={!resource.available}
                checked={
                  resource.kind === "knowledge"
                    ? options.knowledge.includes(resource.id)
                    : options.memory.includes(resource.id)
                }
                onChange={(event) =>
                  setOptions(
                    resource.kind === "knowledge"
                      ? {
                          ...options,
                          knowledge: toggle(
                            options.knowledge,
                            resource.id,
                            event.target.checked,
                          ),
                        }
                      : {
                          ...options,
                          memory: toggle(
                            options.memory,
                            resource.id,
                            event.target.checked,
                          ),
                        },
                  )
                }
              />{" "}
              {t(`publish.export.include.${resource.kind}`, {
                name: resource.name,
              })}{" "}
              <span className="muted small">
                {resource.kind === "knowledge"
                  ? formatBytes(resource.size)
                  : null}{" "}
                · {resource.used_by.join(", ")}
              </span>
            </label>
          ))}
        </section>
      ) : null}

      {check.isFetching || !current ? <Spinner /> : null}
      {check.error ? (
        <Callout tone="danger">
          <ErrorText error={check.error} />
        </Callout>
      ) : null}
      {check.data ? (
        <>
          <Problems problems={shownProblems(check.data.problems, portable)} />
          {portable && check.data.portable ? (
            <PortableSummary portable={check.data.portable} options={options} />
          ) : null}
          <Section
            title={t("publish.export.contents", {
              count: check.data.files.length,
            })}
          >
            <p className="small">
              {t("publish.export.runtime", check.data.runtime)}
            </p>
            <p className="small muted">
              {t("publish.export.dependencies", {
                names: check.data.dependencies.join(", "),
              })}
            </p>
            <ul className="api-files small">
              {check.data.files.map((file) => (
                <li key={file}>
                  <code>{file}</code>
                </li>
              ))}
            </ul>
          </Section>
        </>
      ) : null}

      <Section title={t("publish.guide.title")} icon={Sparkles}>
        <div className="stack-sm">
          <p className="muted small">{t("publish.guide.intro")}</p>
          {!draft ? (
            <div>
              <Button
                icon={Sparkles}
                onClick={() => setGuideOpen(true)}
                busy={writeGuide.isPending}
                data-testid="api-guide-write"
              >
                {t("publish.guide.write")}
              </Button>
            </div>
          ) : null}
          {guideOpen && !writeGuide.isPending ? (
            <Callout tone="warning">
              {t("publish.guide.cost")}{" "}
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setGuideOpen(false);
                  writeGuide.mutate();
                }}
              >
                {t("publish.guide.confirm")}
              </Button>{" "}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setGuideOpen(false)}
              >
                {t("common.cancel")}
              </Button>
            </Callout>
          ) : null}
          {draft ? (
            <div className="api-guide">
              <p className="small muted">
                {t("publish.guide.draft", {
                  cost: formatCost(draft.usage.estimated_cost_usd),
                  model: draft.model,
                })}
              </p>
              <div className="api-guide__text">
                <Output value={draft.markdown} />
              </div>
              <div className="row-gap">
                <Button
                  icon={Check}
                  onClick={() =>
                    decide.mutate({ guide: draft, decision: "accept" })
                  }
                >
                  {t("publish.guide.accept")}
                </Button>
                <Button
                  icon={X}
                  variant="ghost"
                  onClick={() =>
                    decide.mutate({ guide: draft, decision: "discard" })
                  }
                >
                  {t("publish.guide.discard")}
                </Button>
              </div>
            </div>
          ) : null}
          {accepted.length ? (
            <Field label={t("publish.guide.include")}>
              <Select
                value={options.guide_id ?? ""}
                onChange={(value) =>
                  setOptions({ ...options, guide_id: value || null })
                }
                options={[
                  { value: "", label: t("publish.guide.none") },
                  ...accepted.map((guide) => ({
                    value: guide.id,
                    label: formatDate(guide.created_at),
                  })),
                ]}
              />
            </Field>
          ) : null}
        </div>
      </Section>

      <div>
        <Hint id="publish.export">
          <Button
            variant="primary"
            icon={PackageOpen}
            disabled={!check.data?.ok || !current}
            busy={portable ? build.isPending : create.isPending}
            onClick={() => (portable ? build.mutate() : create.mutate())}
            data-testid="api-export-create"
          >
            {portable
              ? t("publish.export.portable.build")
              : t("publish.export.create")}
          </Button>
        </Hint>
      </div>
      <ExportJobs
        publicationId={publication.id}
        onDone={() => {
          void history.refetch();
          onChanged();
        }}
      />

      {history.data?.length ? (
        <section className="stack-sm">
          <h3 className="api-heading">{t("publish.export.history")}</h3>
          <ul className="api-exports" data-testid="api-exports">
            {history.data.map((record) => (
              <li key={record.id}>
                <a href={api.exportUrl(record.id)} download={record.file_name}>
                  <Download size={13} aria-hidden /> {record.file_name}
                </a>
                <span className="muted small">
                  {formatDate(record.created_at)}
                </span>
                <span className="muted small">{formatBytes(record.size)}</span>
                {record.options.kind === "portable" ? (
                  <Badge tone="success">
                    {t("publish.export.portable.badge", {
                      platform: record.options.platform ?? "",
                    })}
                  </Badge>
                ) : (
                  <Badge>
                    {record.options.orkexa === "git"
                      ? t("publish.export.libraryGit")
                      : t("publish.export.libraryBundle")}
                  </Badge>
                )}
                {record.options.knowledge.length ||
                record.options.memory.length ? (
                  <Badge tone="warning">{t("publish.export.withData")}</Badge>
                ) : null}
                {canEdit ? (
                  <ConfirmIconButton
                    icon={Trash2}
                    label={t("publish.export.delete", { file: record.file_name })}
                    busy={remove.isPending && remove.variables === record.id}
                    onConfirm={() => remove.mutate(record.id)}
                    data-testid="api-export-delete"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/**
 * In a ready-to-run package the summary already names the downloads in words, so "export.downloads" would say it
 * twice. The library is always bundled there: APIs before PR #87 also sent the source project's "confirm or choose
 * the Git reference" (export.distribution_unconfirmed) next to the portable confirmation; newer ones no longer do,
 * and the filter stays for the older ones.
 */
export function shownProblems(problems: ExportCheck["problems"], portable: boolean): ExportCheck["problems"] {
  if (!portable) return problems;
  const portableConfirm = problems.some((problem) => problem.code === "export.portable_distribution");
  return problems.filter(
    (problem) =>
      problem.code !== "export.downloads" && !(portableConfirm && problem.code === "export.distribution_unconfirmed"),
  );
}
