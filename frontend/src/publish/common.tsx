// Small pieces shared by the panels of the "API & Export" dialog.

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { CheckIssue, WorkflowCheck } from "../api/types";
import { IconButton } from "../components/ui";
import { CheckList } from "../editor/CheckList";

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      icon={copied ? Check : Copy}
      label={copied ? t("publish.copied") : (label ?? t("publish.copy"))}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    />
  );
}

/** A block of code or text with a copy button. */
export function CodeBlock({ text, testId }: { text: string; testId?: string }) {
  return (
    <div className="api-code">
      <pre className="code-block" data-testid={testId}>
        {text}
      </pre>
      <span className="api-code__copy">
        <CopyButton text={text} />
      </span>
    </div>
  );
}

/** Problems of a check (publishing or export) in the editor's check list. */
export function Problems({ problems, agents }: { problems: CheckIssue[]; agents?: WorkflowCheck["agents"] }) {
  const check: WorkflowCheck = {
    ok: !problems.some((item) => item.level === "error"),
    problems: problems.map((item) => ({ ...item, node_id: item.node_id ?? null, edge_id: item.edge_id ?? null })),
    agents: agents ?? {},
    errors: 0,
    warnings: 0,
  };
  return <CheckList check={check} />;
}

export function downloadJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
