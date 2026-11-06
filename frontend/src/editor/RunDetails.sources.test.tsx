// The result tab names the knowledge sources the agent's searches returned (ST-013, AD-19).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
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
