import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Code2,
  FlaskConical,
  Play,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { api } from "../api/client";
import { keys, useOrganize, useSettings, useToolDrafts, useTools } from "../api/hooks";
import { ToolDraftPanel } from "../architect/ToolDraftPanel";
import { DiscussIcon } from "../assistant/DiscussButton";
import { useTakeHandover } from "../assistant/handover";
import type { ContextOffer } from "../assistant/store";
import { useContextOffer } from "../assistant/useContextOffer";
import type { CheckResult, ToolInfo, ToolJob, ToolSource } from "../api/types";
import { CodeEditor } from "../components/CodeEditor";
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
import { Badge, Button, Callout, ConfirmIconButton, EmptyState, Field, HelpTip, Hint, PageHeader, Segmented, Spinner, TextArea, TextInput } from "../components/ui";
import { toolDescription } from "../lib/catalog";
import { ToolDependencies } from "../python/DependencyPanel";
import { PlanTable } from "../python/PlanTable";
import { ErrorText, LocalError, ProblemText, problemText } from "../lib/errors";
import { formatCost, relativeTime } from "../lib/format";

type Tab = "library" | "write" | "generate";

export function ToolsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab | null) ?? "library";
  const setTab = (value: Tab) =>
    setParams(value === "library" ? {} : { tab: value }, { replace: true });
  const settings = useSettings();
  return (
    <div className="page">
      <PageHeader
        title={t("nav.tools")}
        doc="tools"
        description={t("tools.description")}
        actions={
          <Segmented<Tab>
            label={t("tools.area")}
            value={tab}
            onChange={setTab}
            options={[
              {
                value: "library",
                label: t("tools.tabs.library"),
                icon: Wrench,
              },
              { value: "write", label: t("tools.tabs.write"), icon: Code2 },
              {
                value: "generate",
                label: t("tools.tabs.generate"),
                icon: Sparkles,
              },
            ]}
          />
        }
      />
      <div className="page__body">
        <PendingDrafts />
        {tab === "library" ? <Library /> : null}
        {tab === "write" ? (
          <WriteTool onSaved={() => setTab("library")} />
        ) : null}
        {tab === "generate" ? <GenerateTool /> : null}
        {settings.data ? (
          <p className="muted small page__note">
            <HelpTip id="tools.sandbox" label={t("tools.sandbox")} />{" "}
            <ShieldCheck size={12} aria-hidden />{" "}
            {t("tools.sandboxNote", {
              sandbox:
                settings.data.sandbox === "docker"
                  ? t("tools.sandboxDocker")
                  : t("tools.sandboxProcess"),
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Tools the Workflow Architect wrote; they wait here until the user tests, approves or rejects them. */
function PendingDrafts() {
  const { t } = useTranslation();
  const drafts = useToolDrafts();
  if (!drafts.data?.length) return null;
  return (
    <section className="panel stack" aria-labelledby="tool-drafts" data-testid="tool-drafts">
      <h2 className="panel__title" id="tool-drafts">
        <Sparkles size={15} aria-hidden /> {t("tools.drafts.title", { count: drafts.data.length })}{" "}
        <HelpTip id="tools.drafts" label={t("tools.drafts.label")} />
      </h2>
      <p className="muted small">{t("tools.drafts.text")}</p>
      {drafts.data.map((draft) => (
        <ToolDraftPanel key={draft.id} draft={draft} />
      ))}
    </section>
  );
}

function Library() {
  const { t } = useTranslation();
  const tools = useTools();
  const organize = useOrganize();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<OrganizeFilterValue>(NO_FILTER);
  // ?tool=<name> (from the global search) opens that tool.
  const [selected, setSelected] = useState<string | null>(() =>
    params.get("tool"),
  );
  const wanted = params.get("tool");
  useEffect(() => {
    if (!wanted) return;
    setSelected(wanted);
    setFilter(NO_FILTER);
    setParams({}, { replace: true });
  }, [wanted, setParams]);
  const shown = applyOrganize(
    tools.data ?? [],
    "tool",
    (item) => item.name,
    filter,
    organize.data,
  );
  const tool =
    tools.data?.find((item) => item.name === selected) ?? shown[0] ?? null;
  if (tools.isLoading) return <Spinner />;
  if (tools.error)
    return (
      <Callout tone="danger">
        <ErrorText error={tools.error} />
      </Callout>
    );
  if (!tools.data?.length)
    return <EmptyState icon={Wrench} title={t("tools.empty")} />;
  return (
    <div className="stack-sm">
      <OrganizeFilter kind="tool" value={filter} onChange={setFilter} />
      <div className="master-detail">
        <ul className="list" aria-label={t("nav.tools")}>
          {!shown.length ? (
            <li className="muted small">{t("organize.noMatch")}</li>
          ) : null}
          {shown.map((item) => (
            <li key={item.name} className="list__row">
              <FavoriteButton kind="tool" id={item.name} name={item.name} />
              <button
                type="button"
                className={`list__item ${tool?.name === item.name ? "selected" : ""}`}
                onClick={() => setSelected(item.name)}
                aria-current={tool?.name === item.name || undefined}
              >
                <span className="list__title">
                  <code>{item.name}</code>
                  <Badge
                    tone={
                      item.kind === "builtin"
                        ? "idle"
                        : item.kind === "generated"
                          ? "running"
                          : "success"
                    }
                  >
                    {t(`tools.kind.${item.kind}`)}
                  </Badge>
                </span>
                <span className="list__text">{toolDescription(t, item)}</span>
                <TagChips kind="tool" id={item.name} />
              </button>
            </li>
          ))}
        </ul>
        {tool ? (
          <ToolDetail
            key={tool.name}
            tool={tool}
            onDeleted={() => setSelected(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

function exampleInput(schema: Record<string, unknown> | null): string {
  const properties = (schema?.properties ?? {}) as Record<
    string,
    { type?: string }
  >;
  const example: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    example[key] =
      value.type === "number" || value.type === "integer"
        ? 0
        : value.type === "boolean"
          ? false
          : value.type === "array"
            ? []
            : "";
  }
  return JSON.stringify(example, null, 2);
}

function ToolDetail({
  tool,
  onDeleted,
}: {
  tool: ToolInfo;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [input, setInput] = useState(() => exampleInput(tool.input_schema));
  const [result, setResult] = useState<{
    output: string;
    is_error: boolean;
  } | null>(null);
  const offer: ContextOffer = { kind: "tool", refId: tool.name, label: tool.name };
  useContextOffer("tool", offer);
  const run = useMutation({
    mutationFn: () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(input) as Record<string, unknown>;
      } catch {
        throw new LocalError("tool.input_not_json");
      }
      return api.runTool(tool.name, parsed);
    },
    onSuccess: setResult,
    onError: toast.error,
  });
  const remove = useMutation({
    mutationFn: () => api.deleteTool(tool.name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.tools });
      toast.success(t("tools.deleted", { name: tool.name }));
      onDeleted();
    },
    onError: toast.error,
  });
  return (
    <section
      className="panel stack"
      aria-label={t("tools.tool", { name: tool.name })}
    >
      <div className="row-between">
        <div>
          <h2 className="panel__title">
            <code>{tool.name}</code>
          </h2>
          <p className="muted small">
            <HelpTip id="tools.kind" label={t("tools.kindLabel")} />{" "}
            {t(`tools.kind.${tool.kind}`)}
            {tool.kind !== "builtin"
              ? ` · ${t("tools.version", { version: tool.version })}`
              : ""}
            {tool.created_at ? ` · ${relativeTime(tool.created_at)}` : ""}
          </p>
        </div>
        <div className="row-gap">
          <DiscussIcon offer={offer} />
          <FavoriteButton kind="tool" id={tool.name} name={tool.name} />
          <TagEditor kind="tool" id={tool.name} name={tool.name} />
          {tool.kind !== "builtin" ? (
            <ConfirmIconButton icon={Trash2} label={t("tools.delete")} busy={remove.isPending} onConfirm={() => remove.mutate()} />
          ) : null}
        </div>
      </div>
      <TagChips kind="tool" id={tool.name} />
      <p>{toolDescription(t, tool)}</p>
      {tool.requirement ? (
        <Callout tone="brand">
          <strong>{t("tools.requirement")}</strong> {tool.requirement}
        </Callout>
      ) : null}
      <Field label={t("tools.schema")} tip="tools.schema">
        <pre className="code-block">
          {JSON.stringify(tool.input_schema, null, 2)}
        </pre>
      </Field>
      {tool.code ? (
        <ToolDependencies
          name={tool.name}
          code={tool.code}
          tests={tool.tests ?? ""}
        />
      ) : null}
      {tool.code ? (
        <details className="section">
          <summary>
            <span className="section__title">{t("tools.viewCode")}</span>
          </summary>
          <div className="section__body">
            <CodeEditor
              value={tool.code}
              readOnly
              ariaLabel={t("tools.codeOfTool")}
            />
            {tool.tests ? (
              <CodeEditor
                value={tool.tests}
                readOnly
                ariaLabel={t("tools.testsOfTool")}
              />
            ) : null}
          </div>
        </details>
      ) : null}
      <Field label={t("tools.try")} hint={t("tools.tryHint")} tip="tools.try">
        <CodeEditor
          value={input}
          onChange={setInput}
          language="json"
          minHeight="80px"
          ariaLabel={t("tools.inputJson")}
        />
      </Field>
      <div>
        <Button icon={Play} busy={run.isPending} onClick={() => run.mutate()}>
          {t("tools.run")}
        </Button>
      </div>
      {result ? (
        <pre
          className={`code-block ${result.is_error ? "code-block--error" : ""}`}
          aria-live="polite"
        >
          {result.output}
        </pre>
      ) : null}
    </section>
  );
}

function CheckReport({ check }: { check: CheckResult }) {
  const { t } = useTranslation();
  return (
    <div className="stack-sm" aria-live="polite">
      {check.ok ? (
        <Callout tone="brand">
          {check.name
            ? t("tools.check.passedTool", { name: check.name })
            : t("tools.check.passed")}
          {check.description ? (
            <div className="small">{check.description}</div>
          ) : null}
        </Callout>
      ) : null}
      {check.errors.map((error, index) => (
        <Callout key={index} tone="danger">
          <ProblemText item={error} />
        </Callout>
      ))}
      {check.tests.length ? (
        <ul className="test-list">
          {check.tests.map((test) => (
            <li key={test.name} className={test.ok ? "ok" : "failed"}>
              {test.ok ? (
                <CheckCircle2 size={14} aria-hidden />
              ) : (
                <XCircle size={14} aria-hidden />
              )}
              <code>{test.name}</code>
              <span>{test.ok ? t("tools.check.testPassed") : test.error}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {check.output ? (
        <details>
          <summary className="small">{t("tools.check.sandboxOutput")}</summary>
          <pre className="code-block">{check.output}</pre>
        </details>
      ) : null}
    </div>
  );
}

function WriteTool({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const template = useQuery({
    queryKey: ["tool-template"],
    queryFn: api.toolTemplate,
    staleTime: Infinity,
  });
  const [source, setSource] = useState<ToolSource | null>(null);
  const [check, setCheck] = useState<CheckResult | null>(null);
  useEffect(() => {
    if (template.data && !source) setSource(template.data);
  }, [template.data, source]);

  const runCheck = useMutation({
    mutationFn: api.checkTool,
    onSuccess: setCheck,
    onError: toast.error,
  });
  const save = useMutation({
    mutationFn: api.saveTool,
    onSuccess: (result) => {
      setCheck(result.check);
      if (result.tool) {
        void queryClient.invalidateQueries({ queryKey: keys.tools });
        toast.success(t("tools.saved", { name: result.tool.name }));
        onSaved();
      }
    },
    onError: toast.error,
  });

  if (!source) return <Spinner />;
  const update = (patch: Partial<ToolSource>) => {
    setSource({ ...source, ...patch });
    setCheck(null);
  };
  return (
    <div className="two-column">
      <section className="panel stack" aria-label={t("common.code")}>
        <Callout>
          <Trans i18nKey="tools.write.intro" components={{ code: <code /> }} />
        </Callout>
        <Field
          label={t("tools.write.functionName")}
          htmlFor="tool-fn"
          tip="tools.functionName"
        >
          <TextInput
            id="tool-fn"
            value={source.function_name}
            onChange={(e) => update({ function_name: e.target.value })}
          />
        </Field>
        <Field label={t("common.code")}>
          <CodeEditor
            value={source.code}
            onChange={(code) => update({ code })}
            minHeight="240px"
            ariaLabel={t("common.code")}
          />
        </Field>
        <Field label={t("common.tests")} tip="tools.tests">
          <CodeEditor
            value={source.tests}
            onChange={(tests) => update({ tests })}
            minHeight="160px"
            ariaLabel={t("common.tests")}
          />
        </Field>
        <div className="row-gap">
          <Hint id="tools.check">
            <Button
              icon={FlaskConical}
              busy={runCheck.isPending}
              onClick={() => runCheck.mutate(source)}
            >
              {t("tools.write.check")}
            </Button>
          </Hint>
          <Hint id="tools.save">
            <Button
              variant="primary"
              icon={Save}
              busy={save.isPending}
              onClick={() => save.mutate(source)}
            >
              {t("common.save")}
            </Button>
          </Hint>
        </div>
      </section>
      <section className="panel stack" aria-label={t("tools.write.result")}>
        <h2 className="panel__title">{t("tools.write.result")}</h2>
        {check ? (
          <CheckReport check={check} />
        ) : (
          <p className="muted small">{t("tools.write.notChecked")}</p>
        )}
        {check ? (
          <ToolDependencies
            name={source.function_name}
            code={source.code}
            tests={source.tests}
            onDone={() => runCheck.mutate(source)}
          />
        ) : null}
      </section>
    </div>
  );
}

const JOB_TONE: Record<
  ToolJob["status"],
  "running" | "warning" | "success" | "danger" | "idle"
> = {
  running: "running",
  awaiting_dependencies: "warning",
  awaiting_approval: "warning",
  approved: "success",
  rejected: "idle",
  failed: "danger",
};

function GenerateTool() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [requirement, setRequirement] = useState("");
  // A tool proposed in the assistant only fills in the requirement; the user starts the job.
  useTakeHandover(
    (handover) => handover.target === "tool_builder",
    (handover) => setRequirement(handover.instruction),
  );
  const jobs = useQuery({
    queryKey: keys.toolJobs,
    queryFn: api.toolJobs,
    refetchInterval: (query) =>
      query.state.data?.some((job) => job.status === "running") ? 1500 : 6000,
  });
  const start = useMutation({
    mutationFn: () => api.startToolJob(requirement),
    onSuccess: () => {
      setRequirement("");
      void queryClient.invalidateQueries({ queryKey: keys.toolJobs });
    },
    onError: toast.error,
  });
  const decide = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.decideToolJob(id, approved),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.toolJobs });
      window.setTimeout(
        () => void queryClient.invalidateQueries({ queryKey: keys.tools }),
        800,
      );
    },
    onError: toast.error,
  });
  const decideDependencies = useMutation({
    mutationFn: ({
      id,
      choice,
    }: {
      id: string;
      choice: "approve" | "without" | "cancel";
    }) => api.decideToolJobDependencies(id, choice),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: keys.toolJobs }),
    onError: toast.error,
  });
  return (
    <div className="stack">
      <section
        className="panel stack"
        aria-label={t("tools.generate.describe")}
      >
        <Field
          label={t("tools.generate.question")}
          htmlFor="tool-requirement"
          tip="tools.generate"
          hint={t("tools.generate.hint")}
        >
          <TextArea
            id="tool-requirement"
            rows={3}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder={t("tools.generate.placeholder")}
          />
        </Field>
        <div>
          <Button
            variant="primary"
            icon={Sparkles}
            busy={start.isPending}
            disabled={requirement.trim().length < 10}
            onClick={() => start.mutate()}
          >
            {t("tools.generate.start")}
          </Button>
        </div>
      </section>
      {jobs.data?.map((job) => {
        const jobMessage = problemText(t, {
          code: job.message_code,
          params: job.message_params,
          message: job.message,
        });
        return (
          <article
            key={job.id}
            className="panel stack"
            aria-label={t("tools.generate.job", {
              requirement: job.requirement,
            })}
          >
            <div className="row-between">
              <div>
                <strong>
                  {job.tool_name ??
                    job.attempts.at(-1)?.function_name ??
                    t("tools.generate.newTool")}
                </strong>
                <p className="muted small">
                  {relativeTime(job.created_at)} ·{" "}
                  {t("tools.generate.attempts", { count: job.attempts.length })}
                  {job.cost_usd !== null
                    ? ` · ${formatCost(job.cost_usd)}`
                    : ""}
                </p>
              </div>
              <Badge tone={JOB_TONE[job.status]}>
                {t(`tools.jobStatus.${job.status}`)}
              </Badge>
            </div>
            <p className="small">{job.requirement}</p>
            <div className="muted small" aria-live="polite">
              {job.status === "running" ? (
                <Spinner label={jobMessage} />
              ) : (
                jobMessage
              )}
            </div>
            {job.error ? (
              <Callout tone="danger">
                <ProblemText
                  item={{ code: "job.failed", message: job.error }}
                />
              </Callout>
            ) : null}
            {job.status === "awaiting_dependencies" && job.dependency_plan ? (
              <div className="approval" data-testid="job-dependencies">
                <Callout tone="warning">
                  {t("tools.generate.dependenciesNote")}{" "}
                  <HelpTip id="python.tool" label={t("python.panel.toolTitle")} />
                </Callout>
                <PlanTable plan={job.dependency_plan} />
                <div className="row-gap">
                  <Button
                    variant="primary"
                    icon={ShieldCheck}
                    disabled={Boolean(job.dependency_plan.error)}
                    busy={decideDependencies.isPending}
                    onClick={() =>
                      decideDependencies.mutate({ id: job.id, choice: "approve" })
                    }
                  >
                    {t("tools.generate.approveLibraries")}
                  </Button>
                  <Button
                    icon={Code2}
                    onClick={() =>
                      decideDependencies.mutate({ id: job.id, choice: "without" })
                    }
                  >
                    {t("tools.generate.withoutLibraries")}
                  </Button>
                  <Button
                    variant="danger"
                    icon={X}
                    onClick={() =>
                      decideDependencies.mutate({ id: job.id, choice: "cancel" })
                    }
                  >
                    {t("tools.generate.reject")}
                  </Button>
                </div>
              </div>
            ) : null}
            {job.status === "awaiting_approval" && job.approval ? (
              <div className="approval">
                <Callout tone="warning">
                  {t("tools.generate.reviewNote")}{" "}
                  <HelpTip
                    id="tools.approve"
                    label={t("tools.generate.approval")}
                  />
                </Callout>
                <p className="small">{String(job.approval.summary ?? "")}</p>
                {Array.isArray(job.approval.dependencies) &&
                job.approval.dependencies.length ? (
                  <p className="small">
                    {t("tools.generate.usesLibraries", {
                      names: (job.approval.dependencies as string[]).join(", "),
                    })}
                  </p>
                ) : null}
                <Field label={t("common.code")}>
                  <CodeEditor
                    value={String(job.approval.code ?? "")}
                    readOnly
                    ariaLabel={t("tools.generate.proposedCode")}
                  />
                </Field>
                <Field label={t("common.tests")}>
                  <CodeEditor
                    value={String(job.approval.tests ?? "")}
                    readOnly
                    ariaLabel={t("tools.generate.proposedTests")}
                  />
                </Field>
                {Array.isArray(job.approval.test_results) ? (
                  <ul className="test-list">
                    {(job.approval.test_results as string[]).map((line) => (
                      <li key={line} className="ok">
                        <CheckCircle2 size={14} aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="row-gap">
                  <Button
                    variant="primary"
                    icon={Check}
                    onClick={() =>
                      decide.mutate({ id: job.id, approved: true })
                    }
                  >
                    {t("tools.generate.approve")}
                  </Button>
                  <Button
                    variant="danger"
                    icon={X}
                    onClick={() =>
                      decide.mutate({ id: job.id, approved: false })
                    }
                  >
                    {t("tools.generate.reject")}
                  </Button>
                </div>
              </div>
            ) : null}
            {job.attempts.length && job.status !== "awaiting_approval" ? (
              <details>
                <summary className="small">
                  {t("tools.generate.viewAttempts")}
                </summary>
                {job.attempts.map((attempt) => (
                  <div key={attempt.number} className="stack-sm">
                    <span className="nd-field-label">
                      {t("tools.generate.attempt", { number: attempt.number })}{" "}
                      <code>{attempt.function_name}</code>
                    </span>
                    <CodeEditor
                      value={attempt.code}
                      readOnly
                      ariaLabel={t("tools.generate.attemptCode", {
                        number: attempt.number,
                      })}
                    />
                  </div>
                ))}
              </details>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
