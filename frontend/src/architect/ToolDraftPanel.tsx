import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FlaskConical, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { ToolDraft } from "../api/types";
import { CodeEditor } from "../components/CodeEditor";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Hint } from "../components/ui";
import { ProblemText } from "../lib/errors";
import { ToolDependencies } from "../python/DependencyPanel";

/**
 * A tool the Workflow Architect wrote: requirement, code and tests to review. Nothing of it has
 * run; testing in the sandbox and approving (test, then register) are explicit decisions.
 */
export function ToolDraftPanel({ draft, onChange }: { draft: ToolDraft; onChange?: (draft: ToolDraft | null) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"code" | "tests">("code");
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.toolDrafts });
    void queryClient.invalidateQueries({ queryKey: keys.tools });
    void queryClient.invalidateQueries({ queryKey: ["check"] });
  };
  const test = useMutation({
    mutationFn: () => api.testToolDraft(draft.id),
    onSuccess: (updated) => onChange?.(updated),
    onError: toast.error,
  });
  const approve = useMutation({
    mutationFn: () => api.approveToolDraft(draft.id),
    onSuccess: (decision) => {
      onChange?.(decision.draft);
      refresh();
      if (decision.tool) toast.success(t("architect.tool.approved", { name: decision.tool.name }));
      else toast.info(t("architect.tool.notApproved"));
    },
    onError: toast.error,
  });
  const reject = useMutation({
    mutationFn: () => api.rejectToolDraft(draft.id),
    onSuccess: () => {
      onChange?.(null);
      refresh();
      toast.success(t("architect.tool.rejected", { name: draft.name }));
    },
    onError: toast.error,
  });
  const check = draft.check;
  const approved = draft.status === "approved";
  return (
    <article className="tool-draft" data-testid={`tool-draft-${draft.name}`}>
      <header className="tool-draft__head">
        <div>
          <h4>
            <code>{draft.name}</code>
          </h4>
          <p className="muted small">{draft.description}</p>
        </div>
        {approved ? (
          <Badge tone="success" icon={ShieldCheck}>
            {t("architect.tool.statusApproved")}
          </Badge>
        ) : (
          <Badge tone="warning">{t("architect.tool.statusDraft")}</Badge>
        )}
      </header>
      <p className="small">
        <strong>{t("architect.tool.requirement")}</strong> {draft.requirement}
      </p>
      {draft.agents.length ? <p className="small muted">{t("architect.tool.usedBy", { names: draft.agents.join(", ") })}</p> : null}
      {!approved ? <Callout tone="warning">{t("architect.tool.notRun")}</Callout> : null}
      {draft.dependencies?.length ? (
        <p className="small" data-testid="draft-libraries">
          {t("architect.tool.libraries", { names: draft.dependencies.join(", ") })}
        </p>
      ) : null}
      {draft.static_errors.length ? (
        <Callout tone="danger">
          {t("architect.tool.staticErrors")}
          <ul>
            {draft.static_errors.map((error, index) => (
              <li key={index}>
                <ProblemText item={error} compact />
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}
      <div className="tabs" role="tablist">
        {(["code", "tests"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={view === item}
            className={view === item ? "selected" : undefined}
            onClick={() => setView(item)}
          >
            {t(`architect.tool.${item}`)}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        <CodeEditor value={view === "code" ? draft.code : draft.tests} readOnly ariaLabel={t(`architect.tool.${view}`)} minHeight="120px" />
      </div>
      {check ? (
        <div className={`tool-draft__check ${check.ok ? "tool-draft__check--ok" : "tool-draft__check--failed"}`} role="status">
          {check.ok ? <CheckCircle2 size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
          <span>
            {check.ok
              ? t("architect.tool.testsPassed", { count: check.tests.length })
              : t("architect.tool.testsFailed", { failed: check.tests.filter((item) => !item.ok).length, count: check.tests.length })}
          </span>
          {check.errors.map((error, index) => (
            <span key={index} className="small">
              <ProblemText item={error} compact />
            </span>
          ))}
        </div>
      ) : null}
      {!approved && check?.dependencies_pending ? (
        <ToolDependencies name={draft.name} code={draft.code} tests={draft.tests} onDone={() => test.mutate()} />
      ) : null}
      {!approved ? (
        <footer className="tool-draft__actions">
          <Button variant="ghost" icon={Trash2} busy={reject.isPending} onClick={() => reject.mutate()}>
            {t("architect.tool.reject")}
          </Button>
          <Hint id="architect.toolTest">
            <Button icon={FlaskConical} busy={test.isPending} onClick={() => test.mutate()}>
              {t("architect.tool.test")}
            </Button>
          </Hint>
          <Hint id="architect.toolApprove">
            <Button variant="primary" icon={ShieldCheck} busy={approve.isPending} onClick={() => approve.mutate()}>
              {t("architect.tool.approve")}
            </Button>
          </Hint>
        </footer>
      ) : null}
    </article>
  );
}
