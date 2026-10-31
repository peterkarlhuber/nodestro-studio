import { describe, expect, it } from "vitest";

import type { BenchmarkRun, Suite, VersionSummary } from "../api/types";
import { suiteTestStatus, testedVersion } from "./testStatus";

const suite = (updated: string): Suite =>
  ({ id: "suite_1", name: "Regression", workflow_id: "wf_1", updated_at: updated, created_at: updated, cases: [] }) as unknown as Suite;

const run = (created: string, version: number | null, extra: Partial<BenchmarkRun> = {}): BenchmarkRun =>
  ({
    id: `bench_${created}`,
    suite_id: "suite_1",
    workflow_version: version,
    status: "finished",
    created_at: created,
    summary: { cases: 5, passed: 4 },
    ...extra,
  }) as unknown as BenchmarkRun;

const versions = [
  { number: 1, created_at: "2026-10-30T08:00:00+00:00" },
  { number: 2, created_at: "2026-10-31T08:00:00+00:00" },
] as VersionSummary[];

const SUITE = suite("2026-10-31T09:00:00+00:00");

describe("test status of a version", () => {
  it("is untested without a finished run", () => {
    const status = suiteTestStatus(SUITE, [run("2026-10-31T10:00:00+00:00", 2, { status: "running" })], 2, versions);
    expect(status.state).toEqual({ kind: "untested" });
    expect(status.running).toBe(true);
  });

  it("counts the latest finished run of exactly this version", () => {
    const older = run("2026-10-31T10:00:00+00:00", 2, { summary: { cases: 5, passed: 2 } as BenchmarkRun["summary"] });
    const latest = run("2026-10-31T11:00:00+00:00", 2);
    const status = suiteTestStatus(SUITE, [older, latest], 2, versions);
    expect(status.state).toMatchObject({ kind: "tested", passed: 4, cases: 5 });
    expect(status.running).toBe(false);
  });

  it("is outdated when another version was tested", () => {
    const status = suiteTestStatus(SUITE, [run("2026-10-31T10:00:00+00:00", 1)], 2, versions);
    expect(status.state).toMatchObject({ kind: "outdated", reason: "version", testedVersion: 1 });
  });

  it("is outdated when the suite changed after the run", () => {
    const status = suiteTestStatus(suite("2026-10-31T12:00:00+00:00"), [run("2026-10-31T10:00:00+00:00", 2)], 2, versions);
    expect(status.state).toMatchObject({ kind: "outdated", reason: "suite" });
  });

  it("resolves a run on the current state to the version saved before it", () => {
    expect(testedVersion(run("2026-10-31T10:00:00+00:00", null), versions)).toBe(2);
    expect(testedVersion(run("2026-10-30T09:00:00+00:00", null), versions)).toBe(1);
    expect(testedVersion(run("2026-10-29T09:00:00+00:00", null), versions)).toBeNull();
    const status = suiteTestStatus(SUITE, [run("2026-10-30T09:00:00+00:00", null)], 2, versions);
    expect(status.state).toMatchObject({ kind: "outdated", reason: "version", testedVersion: 1 });
  });

  it("ignores runs that compared other models", () => {
    const runs = [run("2026-10-31T10:00:00+00:00", 2), run("2026-10-31T11:00:00+00:00", 2, { models: { worker: "anthropic:claude-haiku-4-5" } })];
    expect(suiteTestStatus(SUITE, runs, 2, versions).state).toMatchObject({ kind: "tested", run: { id: "bench_2026-10-31T10:00:00+00:00" } });
    expect(suiteTestStatus(SUITE, runs.slice(1), 2, versions).state).toEqual({ kind: "untested" });
  });

  it("ignores stopped and cancelled runs", () => {
    const runs = [run("2026-10-31T10:00:00+00:00", 2), run("2026-10-31T11:00:00+00:00", 1, { status: "cancelled" })];
    expect(suiteTestStatus(SUITE, runs, 2, versions).state).toMatchObject({ kind: "tested" });
  });
});
