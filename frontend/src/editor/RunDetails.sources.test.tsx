// The result tab names the knowledge sources the agent's searches returned (ST-013, AD-19).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { NodeRun } from "../api/types";
import { newNode } from "../lib/defaults";
import { NodeRunDetails } from "./RunDetails";

afterEach(cleanup);

const node = { ...newNode("agent", { x: 0, y: 0 }, { name: "Recherche" }), id: "a", label: "Recherche" };

function state(tool_calls: NodeRun["tool_calls"]): NodeRun {
  return {
    status: "succeeded",
    prompt: "p",
    output: "Antwort",
    text: "Antwort",
    thinking: "",
    started_at: "2026-11-06T10:00:00Z",
    finished_at: "2026-11-06T10:00:05Z",
    error: null,
    tool_calls,
    usage: {
      requests: 1,
      input_tokens: 10,
      output_tokens: 5,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      total_tokens: 15,
      estimated_cost_usd: 0.001,
    },
    evaluation: null,
    memory: null,
  } as NodeRun;
}

function show(value: NodeRun) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <NodeRunDetails node={node} state={value} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const search = (output: string) => ({
  id: "c1",
  name: "search",
  input: { query: "Rückgabe" },
  output,
  is_error: false,
  started_at: "2026-11-06T10:00:01Z",
  finished_at: "2026-11-06T10:00:02Z",
});

describe("knowledge sources of a result", () => {
  it("lists file and page with the number of passages", () => {
    show(
      state([
        search("[search_result 'kf_1' 'Handbuch.pdf, p. 3'] A\n[search_result 'kf_1' 'Handbuch.pdf, p. 3'] B\n[search_result 'kf_2' 'faq.md'] C"),
      ]),
    );
    const box = screen.getByRole("region", { name: "Verwendete Wissensquellen" });
    const items = within(box).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["Handbuch.pdf, p. 3 (2 Abschnitte)", "faq.md"]);
  });

  it("is not shown without a knowledge search", () => {
    show(state([]));
    expect(screen.queryByTestId("used-sources")).toBeNull();
  });
});

describe("tool calls of a step", () => {
  it("are the shared ToolCallRow of @nodestro/ui-ai as compact disclosures with the step's words (ST-068)", async () => {
    show(state([search("ok"), { ...search("kaputt"), id: "c2", name: "mailer", input: { to: "a@example.org" }, is_error: true }]));
    await userEvent.click(screen.getByRole("tab", { name: /Tools/ }));
    const rows = screen.getAllByRole("group", { name: /search|mailer/ });
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row).toHaveClass("ui-tool-call", "ui-tool-call--disclosure");
    const failed = rows[1] as HTMLDetailsElement;
    expect(failed.open).toBe(false);
    expect(failed.querySelector("summary")).toHaveTextContent(/mailer.*Fehler · .* · /);
    await userEvent.click(failed.querySelector("summary")!);
    expect(failed.open).toBe(true);
    expect(within(failed).getByText("Eingabe")).toBeInTheDocument();
    expect(within(failed).getByText("Ergebnis")).toBeInTheDocument();
    expect(within(failed).getByText(/a@example\.org/)).toBeInTheDocument();
    expect(within(failed).getByText("kaputt")).toHaveClass("code-block--error");
  });
});
