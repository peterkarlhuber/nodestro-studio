import { useMutation } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { useSettings } from "../api/hooks";
import type { InputField, Run, WorkflowCheck } from "../api/types";
import { FileInput } from "../components/FileInput";
import { providerList } from "../components/ModelPicker";
import { Button, Callout, Field, HelpTip, Modal, TextArea } from "../components/ui";
import { FormFields, fieldErrors, formDefaults } from "../components/FormFields";
import { ErrorText, LocalError } from "../lib/errors";
import { formatCost } from "../lib/format";
import { missingProviders } from "../lib/providers";
import { CheckList } from "./CheckList";
import { useEditor } from "./store";

/** The run's extra files (besides the form): any known format, several files. */
const RUN_FILES: InputField = {
  name: "files",
  label: "",
  type: "file",
  description: "",
  required: false,
  default: null,
  options: [],
  multiple: true,
  max_size_mb: 50,
};

export function RunDialog({
  open,
  onClose,
  onStarted,
  save,
  check,
}: {
  open: boolean;
  onClose: () => void;
  onStarted: (run: Run) => void;
  save: () => Promise<string | null>;
  /** The pre-check of the current graph; errors block the start, warnings are shown. */
  check?: WorkflowCheck;
}) {
  const { t } = useTranslation();
  const nodes = useEditor((s) => s.nodes);
  const budget = useEditor((s) => s.budget);
  const settings = useSettings();
  const start = nodes.find((node) => node.type === "start");
  const missing = missingProviders(
    settings.data,
    nodes.flatMap((node) => (node.agent ? [node.agent.model, node.agent.quality.enabled ? node.agent.quality.judge_model : null] : [])),
  );
  const [input, setInput] = useState("");
  const [fileIds, setFileIds] = useState<string[]>([]);
  const fields = start?.start?.fields ?? [];
  const [values, setValues] = useState<Record<string, unknown>>({});
  useEffect(() => {
    if (open) {
      setInput(start?.start?.default_input ?? "");
      setValues(formDefaults(start?.start?.fields ?? []));
      setFileIds([]);
      setPending({});
    }
  }, [open, start?.start?.default_input, start?.start?.fields]);

  // Uploads still running per field: the run starts only with every file in place.
  const [pending, setPending] = useState<Record<string, number>>({});
  const uploading = Object.values(pending).some((count) => count > 0);
  const run = useMutation({
    mutationFn: async () => {
      const id = await save();
      if (!id) throw new LocalError("workflow.save_failed");
      return api.startRun(id, input, fileIds, values);
    },
    onSuccess: (result) => {
      onStarted(result);
      onClose();
    },
  });
  const effectiveBudget = budget ?? settings.data?.default_budget_usd ?? null;
  return (
    <Modal
      title={t("editor.run.title")}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            icon={Play}
            busy={run.isPending}
            disabled={(check ? !check.ok : false) || uploading}
            title={uploading ? t("inputs.waitForUploads") : undefined}
            onClick={() => run.mutate()}
          >
            {t("editor.run.start")}
          </Button>
        </>
      }
    >
      {missing.length ? (
        <Callout tone="warning">
          {t("editor.run.providerMissing", { providers: providerList(t, missing) })} <Link to="/settings">{t("editor.run.openSettings")}</Link>
        </Callout>
      ) : null}
      {check && !check.ok ? (
        <Callout tone="danger">
          <strong>{t("editor.check.blocked", { count: check.errors })}</strong>
          <CheckList check={check} levels={["error"]} />
        </Callout>
      ) : null}
      {check?.warnings ? (
        <details className="check-details">
          <summary>{t("editor.check.warningsBeforeStart", { count: check.warnings })}</summary>
          <CheckList check={check} levels={["warning"]} />
        </details>
      ) : null}
      {fields.length ? (
        <>
          <p className="field__hint">
            {t("flow.form.runIntro")} <HelpTip id="flow.form" label={t("flow.form.title")} />
          </p>
          <FormFields
            fields={fields}
            values={values}
            onChange={setValues}
            errors={fieldErrors(run.error)}
            onPendingChange={(name, count) => setPending((current) => ({ ...current, [name]: count }))}
          />
          <Field label={t("flow.form.extraInput")} hint={t("flow.form.extraInputHint")} tip="workflow.runInput">
            <TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} />
          </Field>
        </>
      ) : (
        <Field label={t("editor.run.input")} hint={t("editor.run.inputHint")} tip="workflow.runInput">
          <TextArea rows={7} autoFocus value={input} onChange={(e) => setInput(e.target.value)} />
        </Field>
      )}
      <Field label={t("editor.run.files")} hint={t("inputs.runFilesHint")} tip="workflow.runFiles" htmlFor="run-files">
        <FileInput
          id="run-files"
          field={RUN_FILES}
          value={fileIds}
          onChange={setFileIds}
          onPendingChange={(count) => setPending((current) => ({ ...current, [RUN_FILES.name]: count }))}
        />
      </Field>
      <p className="field__hint">
        <HelpTip id="workflow.runBudget" label={t("editor.run.budget")} />{" "}
        {t("editor.run.budgetText", { budget: effectiveBudget === null ? t("editor.run.unlimited") : formatCost(effectiveBudget) })}
      </p>
      {run.error ? (
        <Callout tone="danger">
          <ErrorText error={run.error} />
        </Callout>
      ) : null}
    </Modal>
  );
}
