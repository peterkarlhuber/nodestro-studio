import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { NodeRun, Run, ToolCallRecord, WorkflowNode } from "../api/types";
import { codedToolOutput } from "../lib/toolOutput";
import {
  InterruptedNotice,
  RunOutcome,
  StepStatus,
  ToolProblemsNotice,
  finishedWithProblems,
  toolProblems,
  unfinishedSteps,
} from "./RunProblems";

const node = (id: string, type: WorkflowNode["type"], label: string): WorkflowNode =>
  ({ id, type, label, position: { x: 0, y: 0 }, agent: null, start: null }) as WorkflowNode;

const call = (name: string, extra: Partial<ToolCallRecord> = {}): ToolCallRecord => ({
  id: name,
  name,
  input: {},
  output: "ok",
  is_error: false,
  started_at: "2026-11-01T10:00:00Z",
  finished_at: "2026-11-01T10:00:01Z",
  ...extra,
});

const state = (status: NodeRun["status"], calls: ToolCallRecord[] = [], extra: Partial<NodeRun> = {}): NodeRun =>
  ({ status, started_at: "2026-11-01T10:00:00Z", finished_at: null, tool_calls: calls, ...extra }) as NodeRun;

function run(status: Run["status"], states: Record<string, NodeRun>, extra: Partial<Run> = {}): Run {
  return {
    id: "run_1",
    status,
    error: null,
    workflow: { nodes: [node("start", "start", "Start"), node("a", "agent", "Writer"), node("b", "agent", "Checker")], edges: [] },
    nodes: states,
    ...extra,
  } as unknown as Run;
}

afterEach(() => cleanup());

describe("tool problems (AD-03)", () => {
  it("finds expired approvals and an unreachable service in a run that is Done", () => {
    const done = run("succeeded", {
      a: state("succeeded", [
        call("send_message", { is_error: true, output: "Nobody decided", approval: { status: "expired" } }),
        call("lookup"),
      ]),
      b: state("succeeded", [call("mcp__docs__search", { is_error: true, output: "mcp.unreachable: Docs cannot be reached" })]),
    });
    const problems = toolProblems(done);
    expect(problems.map((item) => [item.label, item.tool, item.kind])).toEqual([
      ["Writer", "send_message", "expired"],
      ["Checker", "mcp__docs__search", "coded"],
    ]);
    expect(finishedWithProblems(done)).toBe(true);
  });

  it("counts calls of earlier loop rounds and rejected calls, and leaves clean runs alone", () => {
    const looped = run("succeeded", {
      a: state("succeeded", [], { earlier: [state("succeeded", [call("mailer", { approval: { status: "rejected" } })])] }),
    });
    expect(toolProblems(looped)).toHaveLength(1);
    expect(finishedWithProblems(run("succeeded", { a: state("succeeded", [call("lookup")]) }))).toBe(false);
    // A failed run is not "finished with problems": it failed.
    expect(finishedWithProblems(run("failed", { a: state("failed", [call("x", { is_error: true })]) }))).toBe(false);
  });

  it("shows the chip next to Done and a callout with each call, the reason and a way to the step", async () => {
    const onOpen = vi.fn();
    const done = run("succeeded", {
      a: state("succeeded", [call("send_message", { is_error: true, approval: { status: "expired" } })]),
      b: state("succeeded", [call("mcp__docs__search", { is_error: true, output: "mcp.unreachable: Docs cannot be reached" })]),
    });
    render(
      <>
        <RunOutcome run={done} />
        <ToolProblemsNotice run={done} onOpenStep={onOpen} />
      </>,
    );
    expect(screen.getByTestId("run-with-problems")).toHaveTextContent("Mit Problemen beendet");
    const notice = screen.getByTestId("tool-problems");
    expect(notice).toHaveTextContent("2 Tool-Aufrufe waren nicht erfolgreich");
    expect(notice).toHaveTextContent("niemand hat rechtzeitig entschieden");
    expect(notice).toHaveTextContent("Der Dienst ist nicht erreichbar.");
    await userEvent.click(within(notice).getAllByRole("button", { name: "Zum Schritt" })[0]);
    expect(onOpen).toHaveBeenCalledWith("a");
  });

  it("shows nothing while the run is still running", () => {
    const live = run("running", { a: state("running", [call("x", { is_error: true })]) });
    const { container } = render(<ToolProblemsNotice run={live} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("coded tool output (AD-12)", () => {
  it("maps a known code to its sentence and keeps unknown or parameterized texts as they are", () => {
    expect(codedToolOutput("mcp.unreachable: Docs cannot be reached")?.code).toBe("mcp.unreachable");
    expect(codedToolOutput("mcp.http_error: status 500")).toBeNull();
    expect(codedToolOutput("ValueError: bad input")).toBeNull();
    expect(codedToolOutput("foo.bar: something")).toBeNull();
  });
});

describe("interrupted runs (AD-10)", () => {
  it("names steps that were still waiting when the run ended and offers to continue", async () => {
    const onResume = vi.fn();
    const stopped = run(
      "failed",
      { a: state("waiting"), b: state("succeeded") },
      { error: "Nodestro stopped while this ran", error_code: "run.interrupted" },
    );
    expect(unfinishedSteps(stopped)).toEqual([{ nodeId: "a", label: "Writer" }]);
    render(
      <>
        <InterruptedNotice run={stopped} onResume={onResume} />
        <StepStatus run={stopped} state={stopped.nodes.a} />
      </>,
    );
    expect(screen.getByTestId("run-interrupted")).toHaveTextContent("Writer");
    expect(screen.getByText("Nicht beendet")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Fortsetzen" }));
    expect(onResume).toHaveBeenCalled();
  });

  it("keeps Waiting for a step of a run that is still going", () => {
    const live = run("running", { a: state("waiting") });
    expect(unfinishedSteps(live)).toEqual([]);
    render(<StepStatus run={live} state={live.nodes.a} />);
    expect(screen.getByText("Wartet")).toBeInTheDocument();
  });
});

describe("backend warnings and shutdown (newer backends)", () => {
  it("uses Run.warnings when the tool-call records say nothing, and the list chip from RunSummary.warnings", async () => {
    const { ListProblemsChip } = await import("./RunProblems");
    const done = run("succeeded", { a: state("succeeded") }, { warnings: [{ code: "tool.approval_timeout", node_id: "a", tool: "send_message", count: 1 }] } as never);
    expect(finishedWithProblems(done)).toBe(true);
    render(
      <>
        <ToolProblemsNotice run={done} />
        <ListProblemsChip run={{ status: "succeeded", warnings: [{ code: "tool.approval_timeout" }] } as never} />
      </>,
    );
    expect(screen.getByTestId("tool-problems")).toHaveTextContent("send_message");
    expect(screen.getByTestId("tool-problems")).toHaveTextContent("Niemand hat rechtzeitig entschieden");
    expect(screen.getByTestId("run-with-problems")).toBeInTheDocument();
  });

  it("says that a stop of Nodestro, not a person, ended the run", () => {
    const stopped = run("failed", { a: state("succeeded") }, { error_code: "run.interrupted", error_params: { cause: "shutdown" } });
    render(<InterruptedNotice run={stopped} />);
    expect(screen.getByTestId("run-interrupted")).toHaveTextContent("niemand hat sie abgebrochen");
  });
});
