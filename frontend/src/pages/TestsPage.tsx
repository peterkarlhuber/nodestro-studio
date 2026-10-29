import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Columns2, FlaskConical, Play, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { keys, useSettings, useSuites, useWorkflows } from "../api/hooks";
import type { BenchmarkRun, CaseChange, CaseResult, Suite, SuiteIn, TestCase, Workflow } from "../api/types";
import { BenchmarkStartDialog } from "../automation/BenchmarkStartDialog";
import { BATCH_TONE } from "../automation/status";
import { FormFields } from "../components/FormFields";
import { ModelPicker } from "../components/ModelPicker";
import { Output } from "../components/Markdown";
import { toast } from "../components/toast";
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Field,
  HelpTip,
  IconButton,
  Modal,
  PageHeader,
  Select,
  Spinner,
  Stat,
  TextArea,
  TextInput,
} from "../components/ui";
import { RuleEditor, outputFieldsOf } from "../editor/FlowInspectors";
import { newId, newRule } from "../lib/defaults";
import { ErrorText, problemText } from "../lib/errors";
import { formatCost, formatDate, formatNumber, sumCosts } from "../lib/format";

function newCase(name: string): TestCase {
  return { id: newId("case"), name, input: "", values: {}, file_ids: [], checks: [], judge_criteria: "", expected: "" };
}

export function TestsPage() {
  const { t } = useTranslation();
  const suites = useSuites();
  const workflows = useWorkflows();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const create = useMutation({
    mutationFn: () =>
      api.createSuite({ name, description: "", workflow_id: workflowId, cases: [newCase(t("automation.benchmark.caseN", { n: 1 }))], judge_model: null }),
    onSuccess: (suite) => {
      void queryClient.invalidateQueries({ queryKey: keys.suites });
      navigate(`/tests/${suite.id}`);
    },
  });
  const remove = useMutation({
    mutationFn: api.deleteSuite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.suites }),
    onError: toast.error,
  });
  const workflowName = (id: string) => workflows.data?.find((item) => item.id === id)?.name ?? id;
  return (
    <div className="page">
      <PageHeader
        title={t("nav.tests")}
        doc="automatisierung#testreihen"
        description={t("automation.benchmark.description")}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>
            {t("automation.benchmark.new")}
          </Button>
        }
      />
      <div className="page__body">
        {suites.isLoading ? <Spinner /> : null}
        {suites.data && !suites.data.length ? (
          <EmptyState icon={FlaskConical} title={t("automation.benchmark.empty")}>
            {t("automation.benchmark.emptyText")}
          </EmptyState>
        ) : null}
        {suites.data?.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("automation.columns.name")}</th>
                  <th>{t("automation.workflow")}</th>
                  <th className="num">{t("automation.benchmark.cases")}</th>
                  <th>{t("automation.columns.updated")}</th>
                  <th>
                    <span className="sr-only">{t("automation.columns.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {suites.data.map((suite) => (
                  <tr key={suite.id}>
                    <td>
                      <Link className="table__primary" to={`/tests/${suite.id}`}>
                        {suite.name || t("automation.benchmark.unnamed")}
                      </Link>
                      {suite.description ? <div className="muted small">{suite.description}</div> : null}
                    </td>
                    <td>{workflowName(suite.workflow_id)}</td>
                    <td className="num">{suite.cases.length}</td>
                    <td>{formatDate(suite.updated_at)}</td>
                    <td>
                      <IconButton icon={Trash2} label={t("automation.benchmark.delete")} onClick={() => remove.mutate(suite.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      <Modal
        title={t("automation.benchmark.new")}
        open={creating}
        onClose={() => setCreating(false)}
        footer={
          <Button variant="primary" busy={create.isPending} disabled={!workflowId} onClick={() => create.mutate()}>
            {t("common.create")}
          </Button>
        }
      >
        <Field label={t("automation.columns.name")}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("automation.workflow")}>
          <Select
            value={workflowId}
            placeholder={t("automation.pickWorkflow")}
            onChange={setWorkflowId}
            options={(workflows.data ?? []).map((item) => ({ value: item.id, label: item.name }))}
          />
        </Field>
        {create.error ? (
          <Callout tone="danger">
            <ErrorText error={create.error} />
          </Callout>
        ) : null}
      </Modal>
    </div>
  );
}

/** Field names a check can test: the structured fields of the workflow's agents. */
function resultFields(workflow: Workflow | undefined): string[] {
  return [...new Set((workflow?.nodes ?? []).flatMap((node) => (node.type === "agent" ? outputFieldsOf(node) : [])))];
}

function CaseEditor({
  value,
  index,
  workflow,
  onChange,
  onRemove,
}: {
  value: TestCase;
  index: number;
  workflow: Workflow | undefined;
  onChange: (value: TestCase) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const fields = workflow?.nodes.find((node) => node.type === "start")?.start?.fields ?? [];
  const set = (patch: Partial<TestCase>) => onChange({ ...value, ...patch });
  return (
    <details className="panel case-editor" open={index === 0}>
      <summary className="row-between">
        <strong>{value.name || t("automation.benchmark.caseN", { n: index + 1 })}</strong>
        <span className="muted small">
          {t("automation.benchmark.caseSummary", { checks: value.checks.length, judge: value.judge_criteria.trim() ? "✓" : "–" })}
        </span>
      </summary>
      <div className="stack-sm">
        <div className="row-between">
          <Field label={t("automation.columns.name")}>
            <TextInput value={value.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <IconButton icon={Trash2} label={t("automation.benchmark.removeCase")} onClick={onRemove} />
        </div>
        {fields.length ? <FormFields fields={fields} values={value.values} origin="test" onChange={(values) => set({ values })} /> : null}
        <Field label={fields.length ? t("flow.form.extraInput") : t("editor.run.input")}>
          <TextArea rows={3} value={value.input} onChange={(e) => set({ input: e.target.value })} />
        </Field>
        <div className="field__head">
          <span className="field__label nd-field-label">
            {t("automation.benchmark.checks")} <HelpTip id="automation.benchmarkChecks" label={t("automation.benchmark.checks")} />
          </span>
        </div>
        {value.checks.map((rule, ruleIndex) => (
          <RuleEditor
            key={rule.id}
            rule={rule}
            index={ruleIndex}
            fieldOptions={resultFields(workflow)}
            onChange={(patch) => set({ checks: value.checks.map((item, i) => (i === ruleIndex ? { ...item, ...patch } : item)) })}
            onRemove={() => set({ checks: value.checks.filter((_, i) => i !== ruleIndex) })}
          />
        ))}
        <Button
          size="sm"
          icon={Plus}
          onClick={() =>
            set({ checks: [...value.checks, newRule({ label: t("automation.benchmark.checkN", { n: value.checks.length + 1 }), operator: "contains" })] })
          }
        >
          {t("automation.benchmark.addCheck")}
        </Button>
        <Field
          label={t("automation.benchmark.judgeCriteria")}
          hint={t("automation.benchmark.judgeCriteriaHint")}
          tip="automation.benchmarkJudge"
        >
          <TextArea rows={3} value={value.judge_criteria} onChange={(e) => set({ judge_criteria: e.target.value })} />
        </Field>
        <Field label={t("automation.benchmark.expected")} hint={t("automation.benchmark.expectedHint")}>
          <TextArea rows={3} value={value.expected} onChange={(e) => set({ expected: e.target.value })} />
        </Field>
      </div>
    </details>
  );
}

function PassBadge({ passed }: { passed: boolean | null }) {
  const { t } = useTranslation();
  if (passed === null) return <Badge tone="idle">{t("automation.benchmark.undecided")}</Badge>;
  return <Badge tone={passed ? "success" : "danger"}>{passed ? t("automation.benchmark.passed") : t("automation.benchmark.failed")}</Badge>;
}

function CaseResultView({ result }: { result: CaseResult }) {
  const { t } = useTranslation();
  return (
    <div className="stack-sm">
      {result.checks.length ? (
        <ul className="decision-view__rules">
          {result.checks.map((check) => (
            <li key={check.rule_id}>
              <PassBadge passed={check.passed} /> {check.label}
            </li>
          ))}
        </ul>
      ) : null}
      {result.judge ? (
        <Callout tone={result.judge.passed ? "brand" : "warning"}>
          <strong>{t("automation.benchmark.aiVerdict", { score: formatNumber(result.judge.score, { maximumFractionDigits: 2 }) })}</strong>{" "}
          <span className="muted small">({t("automation.benchmark.aiNote", { model: result.judge.model })})</span>
          {result.judge.error_code ? (
            <div>{problemText(t, { code: result.judge.error_code, message: result.judge.error })}</div>
          ) : null}
          {result.judge.summary ? <p className="approval-card__instructions">{result.judge.summary}</p> : null}
        </Callout>
      ) : null}
      {result.output !== null && result.output !== undefined ? (
        <details>
          <summary>{t("automation.showResult")}</summary>
          <Output value={result.output} />
        </details>
      ) : null}
    </div>
  );
}

function RunResults({ run }: { run: BenchmarkRun }) {
  const { t } = useTranslation();
  const summary = run.summary;
  return (
    <section className="panel stack" aria-label={t("automation.benchmark.results")}>
      <div className="stats">
        <Stat
          label={t("automation.benchmark.passRate")}
          value={`${Math.round(summary.pass_rate * 100)} %`}
          hint={t("automation.benchmark.passCounts", { passed: summary.passed, failed: summary.failed, undecided: summary.undecided })}
        />
        <Stat label={t("automation.benchmark.checks")} value={`${summary.checks_passed} / ${summary.checks_total}`} />
        <Stat
          label={t("automation.benchmark.aiScore")}
          value={summary.judge_score === null ? "–" : formatNumber(summary.judge_score, { maximumFractionDigits: 2 })}
          hint={t("automation.benchmark.judgedCount", { count: summary.judged })}
          tip="automation.benchmarkJudge"
        />
        <Stat
          label={t("runs.stats.cost")}
          value={formatCost(sumCosts(summary.cost_usd, summary.judge_cost_usd))}
          hint={t("automation.benchmark.judgeCost", { cost: formatCost(summary.judge_cost_usd) })}
        />
      </div>
      <table className="table table--compact">
        <thead>
          <tr>
            <th>{t("automation.benchmark.case")}</th>
            <th>{t("automation.columns.status")}</th>
            <th>{t("automation.columns.result")}</th>
            <th className="num">{t("automation.columns.cost")}</th>
          </tr>
        </thead>
        <tbody>
          {run.results.map((result) => (
            <tr key={result.case_id}>
              <td>
                {result.name}
                {result.run_id ? (
                  <div className="small">
                    <Link to={`/executions/${result.run_id}`}>{t("automation.openRun")}</Link>
                  </div>
                ) : null}
              </td>
              <td>
                <PassBadge passed={result.passed} />
                {result.error_code ? <div className="small text-warning">{problemText(t, { code: result.error_code })}</div> : null}
              </td>
              <td>
                <CaseResultView result={result} />
              </td>
              <td className="num">{formatCost(result.cost_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const CHANGE_TONE: Record<CaseChange, "success" | "danger" | "idle" | "warning"> = {
  improved: "success",
  worse: "danger",
  same: "idle",
  changed: "warning",
};

function Comparison({ a, b, onClose }: { a: string; b: string; onClose: () => void }) {
  const { t } = useTranslation();
  const comparison = useQuery({ queryKey: ["benchmark-compare", a, b], queryFn: () => api.compareBenchmarkRuns(a, b) });
  const data = comparison.data;
  const label = (run: BenchmarkRun) =>
    `${formatDate(run.created_at)}${run.workflow_version ? ` · ${t("editor.subworkflow.versionN", { n: run.workflow_version })}` : ""}`;
  return (
    <Modal title={t("automation.benchmark.compareTitle")} open onClose={onClose} wide>
      {comparison.isLoading ? <Spinner /> : null}
      {comparison.error ? (
        <Callout tone="danger">
          <ErrorText error={comparison.error} />
        </Callout>
      ) : null}
      {data ? (
        <table className="table table--compact">
          <thead>
            <tr>
              <th>{t("automation.benchmark.case")}</th>
              <th>A · {label(data.a)}</th>
              <th>B · {label(data.b)}</th>
              <th>{t("automation.benchmark.change")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>{t("automation.benchmark.passRate")}</strong>
              </td>
              <td>{Math.round(data.a.summary.pass_rate * 100)} %</td>
              <td>{Math.round(data.b.summary.pass_rate * 100)} %</td>
              <td />
            </tr>
            {data.cases.map((item) => (
              <tr key={item.case_id}>
                <td>{item.name}</td>
                <td>{item.a ? <PassBadge passed={item.a.passed} /> : "–"}</td>
                <td>{item.b ? <PassBadge passed={item.b.passed} /> : "–"}</td>
                <td>
                  <Badge tone={CHANGE_TONE[item.change]}>{t(`automation.benchmark.changes.${item.change}`)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </Modal>
  );
}

export function SuitePage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const settings = useSettings();
  const suite = useQuery({ queryKey: keys.suite(id), queryFn: () => api.suite(id) });
  const [draft, setDraft] = useState<SuiteIn | null>(null);
  const [starting, setStarting] = useState(false);
  const [shown, setShown] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  useEffect(() => {
    if (suite.data && !draft) setDraft(suite.data);
  }, [suite.data, draft]);
  const workflow = useQuery({
    queryKey: keys.workflow(draft?.workflow_id ?? ""),
    queryFn: () => api.workflow(draft!.workflow_id),
    enabled: Boolean(draft?.workflow_id),
  });
  const runs = useQuery({
    queryKey: keys.benchmarkRuns(id),
    queryFn: () => api.benchmarkRuns(id),
    refetchInterval: (query) =>
      query.state.data?.some((run) => run.status === "running" || run.status === "evaluating") ? 2000 : false,
  });
  const save = useMutation({
    mutationFn: () => api.updateSuite(id, draft!),
    onSuccess: (saved: Suite) => {
      queryClient.setQueryData(keys.suite(id), saved);
      void queryClient.invalidateQueries({ queryKey: keys.suites });
      setDraft(saved);
      toast.success(t("automation.benchmark.saved"));
    },
  });
  if (suite.isLoading || !draft) return <Spinner />;
  const dirty = JSON.stringify(draft) !== JSON.stringify(suite.data);
  const shownRun = runs.data?.find((run) => run.id === (shown ?? runs.data?.[0]?.id));
  const togglePick = (runId: string) =>
    setPicked((current) => (current.includes(runId) ? current.filter((item) => item !== runId) : [...current, runId].slice(-2)));
  return (
    <div className="page">
      <PageHeader
        title={draft.name || t("automation.benchmark.unnamed")}
        doc="automatisierung#testreihen"
        crumbs={
          <>
            <Link to="/tests">{t("nav.tests")}</Link> / <Link to={`/workflows/${draft.workflow_id}`}>{workflow.data?.name ?? "…"}</Link>
          </>
        }
        actions={
          <>
            <Button icon={Save} disabled={!dirty} busy={save.isPending} onClick={() => save.mutate()}>
              {t("common.save")}
            </Button>
            <Button
              variant="primary"
              icon={Play}
              disabled={dirty || !draft.cases.length}
              title={dirty ? t("automation.benchmark.saveFirst") : undefined}
              onClick={() => setStarting(true)}
            >
              {t("automation.benchmark.run")}
            </Button>
          </>
        }
      />
      <div className="page__body stack">
        {save.error ? (
          <Callout tone="danger">
            <ErrorText error={save.error} />
          </Callout>
        ) : null}
        <Field label={t("automation.columns.name")}>
          <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <Field label={t("automation.benchmark.judgeModel")} hint={t("automation.benchmark.judgeModelHint")}>
          <div className="stack-sm">
            <Select
              aria-label={t("automation.benchmark.judgeModel")}
              value={draft.judge_model === null ? "" : "own"}
              onChange={(value) => setDraft({ ...draft, judge_model: value ? (settings.data?.assistant_model ?? "") : null })}
              options={[
                { value: "", label: t("automation.benchmark.defaultJudge") },
                { value: "own", label: t("automation.benchmark.ownJudge") },
              ]}
            />
            {draft.judge_model !== null ? (
              <ModelPicker
                label={t("automation.benchmark.judgeModel")}
                value={draft.judge_model}
                onChange={(judge_model) => setDraft({ ...draft, judge_model })}
              />
            ) : null}
          </div>
        </Field>
        <Field label={t("common.description")}>
          <TextArea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </Field>
        <h2 className="panel__title">{t("automation.benchmark.casesTitle", { count: draft.cases.length })}</h2>
        {draft.cases.map((item, index) => (
          <CaseEditor
            key={item.id}
            value={item}
            index={index}
            workflow={workflow.data}
            onChange={(next) => setDraft({ ...draft, cases: draft.cases.map((other, i) => (i === index ? next : other)) })}
            onRemove={() => setDraft({ ...draft, cases: draft.cases.filter((_, i) => i !== index) })}
          />
        ))}
        <div>
          <Button
            icon={Plus}
            onClick={() => setDraft({ ...draft, cases: [...draft.cases, newCase(t("automation.benchmark.caseN", { n: draft.cases.length + 1 }))] })}
          >
            {t("automation.benchmark.addCase")}
          </Button>
        </div>
        <section className="panel stack" aria-label={t("automation.benchmark.runs")}>
          <div className="row-between">
            <h2 className="panel__title">
              {t("automation.benchmark.runs")} <HelpTip id="automation.benchmarkCompare" label={t("automation.benchmark.compareTitle")} />
            </h2>
            <Button size="sm" icon={Columns2} disabled={picked.length !== 2} onClick={() => setComparing(true)}>
              {t("compare.button", { count: picked.length })}
            </Button>
          </div>
          {!runs.data?.length ? <p className="muted small">{t("automation.benchmark.noRuns")}</p> : null}
          {runs.data?.length ? (
            <table className="table table--compact">
              <tbody>
                {runs.data.map((run) => (
                  <tr key={run.id} className={shownRun?.id === run.id ? "table__row--picked" : undefined}>
                    <td className="table__pick">
                      <input
                        type="checkbox"
                        checked={picked.includes(run.id)}
                        aria-label={t("automation.benchmark.pick", { date: formatDate(run.created_at) })}
                        onChange={() => togglePick(run.id)}
                      />
                    </td>
                    <td>
                      <button type="button" className="link-button" onClick={() => setShown(run.id)}>
                        {formatDate(run.created_at)}
                      </button>
                      {run.workflow_version ? (
                        <span className="muted small"> · {t("editor.subworkflow.versionN", { n: run.workflow_version })}</span>
                      ) : null}
                    </td>
                    <td>
                      <Badge tone={BATCH_TONE[run.status]}>{t(`automation.benchmarkStatus.${run.status}`)}</Badge>
                    </td>
                    <td>
                      {t("automation.benchmark.passCounts", {
                        passed: run.summary.passed,
                        failed: run.summary.failed,
                        undecided: run.summary.undecided,
                      })}
                    </td>
                    <td className="num">{formatCost(sumCosts(run.summary.cost_usd, run.summary.judge_cost_usd))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>
        {shownRun ? <RunResults run={shownRun} /> : null}
      </div>
      {suite.data ? (
        <BenchmarkStartDialog suite={suite.data} open={starting} onClose={() => setStarting(false)} onStarted={(run) => setShown(run.id)} />
      ) : null}
      {comparing && picked.length === 2 ? <Comparison a={picked[0]} b={picked[1]} onClose={() => setComparing(false)} /> : null}
    </div>
  );
}
