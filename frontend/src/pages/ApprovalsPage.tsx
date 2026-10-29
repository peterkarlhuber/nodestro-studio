import { Hand } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useApprovals } from "../api/hooks";
import { Callout, EmptyState, PageHeader, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { ApprovalForm } from "../runs/ApprovalCard";

/** Every approval waiting for a person, oldest first; they survive restarts of Nodestro. */
export function ApprovalsPage() {
  const { t } = useTranslation();
  const approvals = useApprovals();
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
        {approvals.data && !approvals.data.length ? (
          <EmptyState icon={Hand} title={t("approvals.empty")}>
            {t("approvals.emptyText")}
          </EmptyState>
        ) : null}
        <div className="approval-list">
          {(approvals.data ?? []).map((item) => (
            <ApprovalForm key={`${item.run_id}:${item.node_id}`} approval={item} showContext />
          ))}
        </div>
      </div>
    </div>
  );
}
