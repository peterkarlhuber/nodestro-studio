// Export a run as a trace file: complete, or sanitized for sharing. Sanitizing happens on the
// server on a copy for the download only; the stored run stays unchanged.

import { useMutation } from "@tanstack/react-query";
import { Download, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import type { Run, SanitizeReport } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, Modal, Segmented, Toggle } from "../components/ui";
import { ErrorText } from "../lib/errors";

function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** "3 e-mail addresses, 1 API key" in the interface language. */
export function sanitizeSummary(t: ReturnType<typeof useTranslation>["t"], report: SanitizeReport): string {
  const parts = Object.entries(report.replaced)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => t(`export.kind.${kind}`, { count }));
  return parts.length ? parts.join(", ") : t("export.nothingFound");
}

export function TraceExportDialog({ open, onClose, run }: { open: boolean; onClose: () => void; run: Run }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"full" | "sanitized">("sanitized");
  const [personalData, setPersonalData] = useState(true);
  const [contents, setContents] = useState(false);
  const exporting = useMutation({
    mutationFn: () => api.exportRun(run.id, { sanitized: mode === "sanitized", personalData, contents }),
    onSuccess: (data) => {
      downloadJson(data, `run_${run.id}${mode === "sanitized" ? "_sanitized" : ""}.json`);
      if (data.sanitized) toast.success(t("export.done", { summary: sanitizeSummary(t, data.sanitized) }));
      onClose();
    },
  });
  return (
    <Modal
      title={t("export.title")}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" icon={Download} busy={exporting.isPending} onClick={() => exporting.mutate()}>
            {mode === "sanitized" ? t("export.downloadSanitized") : t("export.downloadFull")}
          </Button>
        </>
      }
    >
      <Segmented
        value={mode}
        onChange={setMode}
        label={t("export.mode")}
        options={[
          { value: "sanitized", label: t("export.sanitized"), icon: ShieldCheck },
          { value: "full", label: t("export.full") },
        ]}
      />
      {mode === "full" ? (
        <>
          <p>{t("export.fullText")}</p>
          <Callout tone="warning">{t("export.fullWarning")}</Callout>
        </>
      ) : (
        <>
          <p>{t("export.sanitizedText")}</p>
          <ul className="small export-list">
            <li>{t("export.alwaysSecrets")}</li>
          </ul>
          <Toggle
            checked={personalData}
            onChange={setPersonalData}
            label={t("export.personalData")}
            description={t("export.personalDataText")}
          />
          <Toggle checked={contents} onChange={setContents} label={t("export.contents")} description={t("export.contentsText")} />
          <p className="muted small">{t("export.kept")}</p>
          <Callout tone="warning">{t("export.noGuarantee")}</Callout>
        </>
      )}
      <p className="muted small">{t("export.copyOnly")}</p>
      {exporting.error ? (
        <Callout tone="danger">
          <ErrorText error={exporting.error} />
        </Callout>
      ) : null}
    </Modal>
  );
}
