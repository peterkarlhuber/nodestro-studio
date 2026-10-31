// The latest test-series result for one saved version (Q-1): untested, passed n of m, or outdated with the reason.

import { useQueries, useQuery } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys, useSuites } from "../api/hooks";
import { Badge, Spinner } from "../components/ui";
import { relativeTime } from "../lib/format";
import { type SuiteTestStatus, suiteTestStatus } from "./testStatus";

function StatusRow({ status }: { status: SuiteTestStatus }) {
  const { t } = useTranslation();
  const { suite, state } = status;
  return (
    <li className="test-status__row" data-testid="test-status-row">
      <Link to={`/tests/${encodeURIComponent(suite.id)}`}>{suite.name || t("automation.benchmark.unnamed")}</Link>
      {state.kind === "untested" ? <Badge tone="idle">{t("testStatus.untested")}</Badge> : null}
      {state.kind === "tested" ? (
        <Badge tone={state.passed === state.cases ? "success" : "warning"}>
          {t("testStatus.passed", { passed: state.passed, cases: state.cases })}
        </Badge>
      ) : null}
      {state.kind === "outdated" ? <Badge tone="warning">{t("testStatus.outdated")}</Badge> : null}
      {state.kind !== "untested" ? <span className="muted small">{relativeTime(state.run.created_at)}</span> : null}
      {state.kind === "outdated" ? (
        <span className="muted small">
          {state.reason === "suite"
            ? t("testStatus.suiteChanged")
            : state.testedVersion
              ? t("testStatus.otherVersion", { version: state.testedVersion })
              : t("testStatus.unknownVersion")}
        </span>
      ) : null}
      {status.running ? <span className="muted small">{t("testStatus.running")}</span> : null}
    </li>
  );
}

/** The test series of ``workflowId`` and what their latest result says about saved version ``version``. */
export function TestStatus({ workflowId, version }: { workflowId: string; version: number }) {
  const { t } = useTranslation();
  const suites = useSuites();
  const own = (suites.data ?? []).filter((suite) => suite.workflow_id === workflowId);
  const versions = useQuery({ queryKey: keys.versions(workflowId), queryFn: () => api.versions(workflowId) });
  const runs = useQueries({
    queries: own.map((suite) => ({ queryKey: keys.benchmarkRuns(suite.id), queryFn: () => api.benchmarkRuns(suite.id) })),
  });
  if (suites.isLoading || versions.isLoading || runs.some((item) => item.isLoading)) return <Spinner />;
  if (!suites.data || !versions.data) return null;
  return (
    <div className="test-status stack-sm" data-testid="test-status">
      <p className="small">
        <FlaskConical size={13} aria-hidden /> <strong>{t("testStatus.title", { version })}</strong>
      </p>
      {own.length ? (
        <ul className="test-status__list">
          {own.map((suite, index) => (
            <StatusRow key={suite.id} status={suiteTestStatus(suite, runs[index]?.data ?? [], version, versions.data)} />
          ))}
        </ul>
      ) : (
        <p className="muted small">
          {t("testStatus.noSuite")} <Link to="/tests">{t("testStatus.createSuite")}</Link>
        </p>
      )}
    </div>
  );
}
