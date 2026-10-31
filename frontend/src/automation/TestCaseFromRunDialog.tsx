// Turn a failed run into a test case (Q-4): the server proposes the run's input with credentials and, by default,
// personal data replaced. Nothing is stored until the person picks a series and adds the case.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { keys, useSuites } from "../api/hooks";
import type { Run, SanitizeReport, TestCase } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, Field, HelpTip, Modal, Select, Spinner, TextInput, Toggle } from "../components/ui";
import { sanitizeSummary } from "../editor/TraceExportDialog";
import { ErrorText } from "../lib/errors";
import { formatDate } from "../lib/format";

const NEW = "__new";

export function TestCaseFromRunDialog({ run, open, onClose }: { run: Run; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const suites = useSuites();
  const own = (suites.data ?? []).filter((suite) => suite.workflow_id === run.workflow_id);
  const [personalData, setPersonalData] = useState(true);
  const [name, setName] = useState(() => t("automation.benchmark.fromRun.defaultName", { date: formatDate(run.created_at) }));
  const [picked, setPicked] = useState<string | null>(null);
  const [suiteName, setSuiteName] = useState(() => t("automation.benchmark.fromRun.defaultSuite", { name: run.workflow_name }));
  const target = picked ?? own[0]?.id ?? NEW;
  const proposal = useQuery({
    queryKey: ["test-case-proposal", run.id, personalData],
    queryFn: () => api.proposeTestCase(run.id, personalData),
    enabled: open,
  });
  const data = proposal.data;
  const add = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("no proposal");
      const item: TestCase = { ...data.case, name: name.trim() };
      if (target === NEW) {
        return api.createSuite({ name: suiteName.trim(), description: "", workflow_id: run.workflow_id, cases: [item], judge_model: null });
      }
      // Read the series again just before adding, so a case saved in the meantime is kept.
      const suite = await api.suite(target);
      return api.updateSuite(suite.id, { ...suite, cases: [...suite.cases, item] });
    },
    onSuccess: (suite) => {
      void queryClient.invalidateQueries({ queryKey: keys.suites });
      toast.success(t("automation.benchmark.fromRun.added", { suite: suite.name }));
      onClose();
      navigate(`/tests/${suite.id}`);
    },
    onError: (error) => toast.error(error),
  });
  const fields = run.workflow.nodes.find((node) => node.type === "start")?.start?.fields ?? [];
  const label = (field: string) => fields.find((item) => item.name === field)?.label || field;
  const replaced = data?.case.origin ? sanitizeSummary(t, { replaced: data.case.origin.replaced } as SanitizeReport) : "";
  const options = [
    ...own.map((suite) => ({ value: suite.id, label: suite.name || t("automation.benchmark.unnamed") })),
    { value: NEW, label: t("automation.benchmark.fromRun.newSuite") },
  ];

  return (
    <Modal
      title={t("automation.benchmark.fromRun.title")}
      open={open}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            icon={FlaskConical}
            busy={add.isPending}
            disabled={!data || !name.trim() || (target === NEW && !suiteName.trim())}
            onClick={() => add.mutate()}
            data-testid="case-from-run-add"
          >
            {t("automation.benchmark.fromRun.add")}
          </Button>
        </>
      }
    >
      <div className="stack-sm" data-testid="case-from-run">
        <p className="muted">
          {t("automation.benchmark.fromRun.intro")} <HelpTip id="automation.caseFromRun" label={t("automation.benchmark.fromRun.title")} />
        </p>
        <ul className="small export-list">
          <li>{t("export.alwaysSecrets")}</li>
        </ul>
        <Toggle checked={personalData} onChange={setPersonalData} label={t("export.personalData")} description={t("export.personalDataText")} />
        <Callout tone="warning">{t("export.noGuarantee")}</Callout>
        {proposal.isLoading ? <Spinner /> : null}
        {proposal.error ? (
          <Callout tone="danger">
            <ErrorText error={proposal.error} />
          </Callout>
        ) : null}
        {data ? (
          <>
            <Callout tone="info">
              <ShieldCheck size={13} aria-hidden /> <span data-testid="case-from-run-replaced">{t("automation.benchmark.fromRun.replaced", { summary: replaced })}</span>
            </Callout>
            <div className="panel stack-sm">
              <strong className="small">{t("automation.benchmark.fromRun.preview")}</strong>
              {Object.keys(data.case.values).length ? (
                <dl className="form-values" data-testid="case-from-run-values">
                  {Object.entries(data.case.values).map(([field, value]) => (
                    <div key={field}>
                      <dt>{label(field)}</dt>
                      <dd>{Array.isArray(value) ? value.map(String).join(", ") : String(value ?? "–")}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {data.case.input ? <pre className="code-block code-block--prose">{data.case.input}</pre> : null}
              {data.case.file_ids.length ? (
                <p className="muted small">{t("automation.benchmark.fromRun.files", { count: data.case.file_ids.length })}</p>
              ) : null}
            </div>
            {data.missing_files.length ? (
              <Callout tone="warning">{t("automation.benchmark.fromRun.missingFiles", { count: data.missing_files.length })}</Callout>
            ) : null}
            {data.problems.length ? (
              <Callout tone="warning">
                {t("automation.benchmark.fromRun.problems", { fields: data.problems.map((item) => label(item.field)).join(", ") })}
              </Callout>
            ) : null}
            <p className="muted small">{t("automation.benchmark.fromRun.checksLater")}</p>
            <div className="grid-2">
              <Field label={t("automation.benchmark.fromRun.caseName")}>
                <TextInput value={name} onChange={(event) => setName(event.target.value)} data-testid="case-from-run-name" />
              </Field>
              <Field label={t("automation.benchmark.fromRun.suite")}>
                <Select options={options} value={target} onChange={setPicked} data-testid="case-from-run-suite" />
              </Field>
            </div>
            {target === NEW ? (
              <Field label={t("automation.benchmark.fromRun.suiteName")}>
                <TextInput value={suiteName} onChange={(event) => setSuiteName(event.target.value)} />
              </Field>
            ) : null}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
