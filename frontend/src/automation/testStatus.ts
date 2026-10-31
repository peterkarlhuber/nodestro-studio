// The latest test-series result for one saved workflow version (Q-1), for the publish dialog and the versions dialog.
// Built only from stored suites and test runs: a result counts for a version only when it ran that exact version
// and the suite has not changed since; anything else is "outdated" with the reason, never treated as passed.

import type { BenchmarkRun, Suite, VersionSummary } from "../api/types";

export type SuiteTestState =
  /** The suite never finished a test run. */
  | { kind: "untested" }
  /** The latest finished run tested this version with this suite. */
  | { kind: "tested"; run: BenchmarkRun; passed: number; cases: number }
  /** The latest finished run tested another version, or the suite changed after it. */
  | { kind: "outdated"; run: BenchmarkRun; reason: "version" | "suite"; testedVersion: number | null };

const time = (value: string) => Date.parse(value);

export interface SuiteTestStatus {
  suite: Suite;
  state: SuiteTestState;
  /** A run of this suite is still going. */
  running: boolean;
}

/** The version a run tested: its pinned version, or (started on "current state") the version saved last before it. */
export function testedVersion(run: BenchmarkRun, versions: VersionSummary[]): number | null {
  if (run.workflow_version !== null) return run.workflow_version;
  const before = versions.filter((item) => time(item.created_at) <= time(run.created_at)).map((item) => item.number);
  return before.length ? Math.max(...before) : null;
}

/** A run with other models (Q-2) tested a variant, not the saved version. */
export const isModelVariant = (run: BenchmarkRun) => Object.keys(run.models ?? {}).length > 0;

export function suiteTestStatus(suite: Suite, runs: BenchmarkRun[], version: number, versions: VersionSummary[]): SuiteTestStatus {
  const running = runs.some((run) => run.status === "running" || run.status === "evaluating");
  const finished = runs
    .filter((run) => run.suite_id === suite.id && run.status === "finished" && !isModelVariant(run))
    .sort((a, b) => time(b.created_at) - time(a.created_at));
  const latest = finished[0];
  if (!latest) return { suite, state: { kind: "untested" }, running };
  const tested = testedVersion(latest, versions);
  if (tested !== version) return { suite, state: { kind: "outdated", run: latest, reason: "version", testedVersion: tested }, running };
  if (time(suite.updated_at) > time(latest.created_at)) {
    return { suite, state: { kind: "outdated", run: latest, reason: "suite", testedVersion: tested }, running };
  }
  return { suite, state: { kind: "tested", run: latest, passed: latest.summary.passed, cases: latest.summary.cases }, running };
}
