import { Hand } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useApprovals, useToolApprovals } from "../api/hooks";
import { Callout, EmptyState, PageHeader, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { ApprovalForm } from "../runs/ApprovalCard";
import { ToolApprovalForm } from "../runs/ToolApprovalCard";
import { ToolApprovalRules } from "../runs/ToolApprovalRules";

/** Every approval waiting for a person, oldest first; they survive restarts of Nodestro. Tool calls that wait for a
 * decision (per-call approvals) come first: they have a deadline. */
export function ApprovalsPage() {
  const { t } = useTranslation();
  const approvals = useApprovals();
  const toolApprovals = useToolApprovals();
  const tools = (toolApprovals.data ?? []).filter((item) => item.status === "pending");
  return (
    <div className="page">
      <PageHeader title={t("nav.approvals")} doc="verzweigungen#freigaben-seite" description={t("approvals.description")} />
      <div className="page__body stack">
        {approvals.isLoading ? <Spinner /> : null}
        {approvals.error ? (
          <Callout tone="danger">
            <ErrorText error={approvals.error} />
          </Callout>
        ) : null}
        {approvals.data && !approvals.data.length && !tools.length ? (
          <EmptyState icon={Hand} title={t("approvals.empty")}>
            {t("approvals.emptyText")}
          </EmptyState>
        ) : null}
        <div className="approval-list">
          {tools.map((item) => (
            <ToolApprovalForm key={item.id} request={item} showContext />
          ))}
          {(approvals.data ?? []).map((item) => (
            <ApprovalForm key={`${item.run_id}:${item.node_id}`} approval={item} showContext />
          ))}
        </div>
        <ToolApprovalRules />
      </div>
    </div>
  );
}
