// A new batch: one workflow over the rows of a CSV, XLSX or JSON file.
// Nothing starts before the user saw the rows, the mapping and the estimated cost.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Play } from "lucide-react";
import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { keys, useWorkflows } from "../api/hooks";
import type { BatchIn, ParsedRows } from "../api/types";
import { Badge, Button, Callout, Field, HelpTip, Modal, Select, Spinner, TextInput } from "../components/ui";
import { rowsFromRecords } from "../lib/batch";
import { ErrorText, problemText } from "../lib/errors";
import { EstimateView, type Limits, LimitFields } from "./shared";

export function BatchDialog({ open, onClose, workflowId: initial = "" }: { open: boolean; onClose: () => void; workflowId?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workflows = useWorkflows();
  const fileInput = useRef<HTMLInputElement>(null);
  const [workflowId, setWorkflowId] = useState(initial);
  const [name, setName] = useState("");
  const [parsed, setParsed] = useState<ParsedRows | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [limits, setLimits] = useState<Limits>({ concurrency: 2, max_cost_usd: null, max_failures: null });
  const [confirmed, setConfirmed] = useState(false);
  const workflow = useQuery({
    queryKey: keys.workflow(workflowId),
    queryFn: () => api.workflow(workflowId),
    enabled: Boolean(workflowId),
  });
  const fields = workflow.data?.nodes.find((node) => node.type === "start")?.start?.fields ?? [];
  const parse = useMutation({
    mutationFn: (file: File) => api.parseBatchFile(workflowId, file),
    onSuccess: (result) => {
      setParsed(result);
      setMapping(result.mapping);
    },
  });
  const body: BatchIn | null = useMemo(
    () =>
      parsed
        ? {
            workflow_id: workflowId,
            name,
            rows: rowsFromRecords(parsed.rows, mapping),
            file_ids: [],
            ...limits,
            confirm_external: confirmed,
          }
        : null,
    [parsed, mapping, workflowId, name, limits, confirmed],
  );
  const plan = useQuery({
    queryKey: ["batch-plan", body],
    queryFn: () => api.planBatch(body!),
    enabled: body !== null && body.rows.length > 0,
  });
  const create = useMutation({
    mutationFn: () => api.createBatch(body!),
    onSuccess: (batch) => {
      void queryClient.invalidateQueries({ queryKey: keys.batches });
      onClose();
      navigate(`/batches/${batch.id}`);
    },
  });
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) parse.mutate(file);
  };
  const targets = [
    { value: "input", label: t("automation.batch.freeInput") },
    ...fields.map((field) => ({ value: field.name, label: field.label || field.name })),
  ];
  const needsConfirm = (plan.data?.external_tools.length ?? 0) > 0 && !confirmed;
  return (
    <Modal
      title={t("automation.batch.new")}
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
            icon={Play}
            busy={create.isPending}
            disabled={!plan.data?.valid || needsConfirm}
            onClick={() => create.mutate()}
          >
            {t("automation.batch.start", { count: plan.data?.valid ?? 0 })}
          </Button>
        </>
      }
    >
      <p className="muted">
        {t("automation.batch.intro")} <HelpTip id="automation.batch" label={t("nav.batches")} />
      </p>
      <div className="grid-2">
        <Field label={t("automation.workflow")}>
          <Select
            value={workflowId}
            placeholder={t("automation.pickWorkflow")}
            onChange={(value) => {
              setWorkflowId(value);
              setParsed(null);
            }}
            options={(workflows.data ?? []).map((item) => ({ value: item.id, label: item.name }))}
          />
        </Field>
        <Field label={t("automation.batch.name")}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t("automation.batch.namePlaceholder")} />
        </Field>
      </div>
      <input ref={fileInput} type="file" hidden accept=".csv,.tsv,.txt,.xlsx,.json" data-testid="batch-file" onChange={onFile} />
      <Button icon={FileUp} disabled={!workflowId} busy={parse.isPending} onClick={() => fileInput.current?.click()}>
        {parsed ? t("automation.batch.otherFile") : t("automation.batch.pickFile")}
      </Button>
      <p className="field__hint">{t("automation.batch.fileHint")}</p>
      {parse.error ? (
        <Callout tone="danger">
          <ErrorText error={parse.error} />
        </Callout>
      ) : null}
      {parsed ? (
        <>
          <h3 className="panel__title">
            {t("automation.batch.mapping", { count: parsed.rows.length })}{" "}
            <HelpTip id="automation.batchMapping" label={t("automation.batch.mappingTitle")} />
          </h3>
          <table className="table table--compact mapping-table">
            <thead>
              <tr>
                <th>{t("automation.batch.column")}</th>
                <th>{t("automation.batch.example")}</th>
                <th>{t("automation.batch.target")}</th>
              </tr>
            </thead>
            <tbody>
              {parsed.columns.map((column) => (
                <tr key={column}>
                  <td>
                    <code>{column}</code>
                  </td>
                  <td className="muted small truncate">{parsed.rows[0]?.[column] ?? ""}</td>
                  <td>
                    <Select
                      aria-label={t("automation.batch.targetFor", { column })}
                      value={mapping[column] ?? ""}
                      placeholder={t("automation.batch.ignore")}
                      onChange={(value) => setMapping({ ...mapping, [column]: value })}
                      options={targets}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <LimitFields value={limits} onChange={setLimits} />
          {plan.isLoading ? <Spinner /> : null}
          {plan.error ? (
            <Callout tone="danger">
              <ErrorText error={plan.error} />
            </Callout>
          ) : null}
          {plan.data ? (
            <>
              <p>
                <Badge tone="success">{t("automation.batch.valid", { count: plan.data.valid })}</Badge>{" "}
                {plan.data.invalid ? <Badge tone="danger">{t("automation.batch.invalid", { count: plan.data.invalid })}</Badge> : null}
              </p>
              {plan.data.invalid ? (
                <details>
                  <summary>{t("automation.batch.invalidRows")}</summary>
                  <ul className="small">
                    {plan.data.items
                      .filter((item) => item.status === "invalid")
                      .slice(0, 50)
                      .map((item) => (
                        <li key={item.index}>
                          {t("automation.batch.row", { n: item.index + 1 })}:{" "}
                          {item.errors.length
                            ? item.errors.map((error) => `${error.field}: ${problemText(t, error)}`).join("; ")
                            : problemText(t, { code: item.error_code, params: item.error_params, message: item.error })}
                        </li>
                      ))}
                  </ul>
                </details>
              ) : null}
              <EstimateView
                estimate={plan.data.estimate}
                externalTools={plan.data.external_tools}
                approvals={plan.data.approvals}
                confirmed={confirmed}
                onConfirm={setConfirmed}
              />
            </>
          ) : null}
        </>
      ) : null}
      {create.error ? (
        <Callout tone="danger">
          <ErrorText error={create.error} />
        </Callout>
      ) : null}
    </Modal>
  );
}
