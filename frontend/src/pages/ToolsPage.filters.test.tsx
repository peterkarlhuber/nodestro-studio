import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ToolSpec } from "../api/connections";

import { ToolsPage, matchesSpec } from "./ToolsPage";

// CodeMirror needs a real layout engine; the tool's try-out editor is not under test here.
vi.mock("../components/CodeEditor", () => ({ CodeEditor: () => null }));

const spec = (id: string, extra: Partial<ToolSpec> = {}): ToolSpec => ({
  id,
  version: 1,
  ref: `${id}@1`,
  category: "compute",
  capability: { access: "read", reach: "internal", source: "nodestro" },
  network: "none",
  offline: true,
  connection_type: null,
  params_schema: {},
  cost_unit: null,
  modes: ["desktop", "export", "local-container", "server"],
  timeout_seconds: 30,
  max_calls_per_run: null,
  i18n_key: `tools.builtin.${id}`,
  ...extra,
});

const CATALOG = [
  { name: "calculator", description: "Calculates.", origin: "nodestro", spec: spec("calculator") },
  { name: "text_statistics", description: "Counts.", origin: "nodestro", spec: spec("text_statistics", { category: "data" }) },
  {
    name: "send_mail",
    description: "Sends a mail.",
    origin: "integration",
    spec: spec("send_mail", {
      category: "communication",
      network: "external",
      offline: false,
      connection_type: "smtp",
      capability: { access: "write", reach: "external", source: "author" },
      max_calls_per_run: 5,
    }),
  },
];

const tool = (name: string, kind: string) => ({
  name,
  kind,
  trust: kind === "builtin" ? "trusted" : "user-authored",
  description: `${name} description`,
  input_schema: { type: "object", properties: {} },
  version: 1,
  created_at: null,
  function_name: null,
  code: null,
  tests: null,
  requirement: null,
});

const TOOLS = [tool("calculator", "builtin"), tool("text_statistics", "builtin"), tool("send_mail", "builtin"), tool("my_tool", "custom")];

function serve() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const answer = url === "/api/tools" ? TOOLS : url === "/api/tools/builtin" ? CATALOG : url === "/api/tools/drafts" ? [] : null;
      return answer === null
        ? new Response(JSON.stringify({ detail: "not here" }), { status: 404, headers: { "Content-Type": "application/json" } })
        : new Response(JSON.stringify(answer), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const shownTools = () =>
  within(screen.getByRole("list", { name: "Tools" }))
    .getAllByRole("button")
    .map((button) => button.querySelector("code")?.textContent)
    .filter(Boolean);

describe("Tools page filters from the tool specs", () => {
  it("filters built-in tools by category, network, offline use and connection", async () => {
    serve();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <ToolsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const chips = within(await screen.findByTestId("tool-spec-filter"));
    expect(shownTools()).toEqual(["calculator", "text_statistics", "send_mail", "my_tool"]);
    // Badges from the spec.
    expect(within(screen.getByTestId("tool-spec-send_mail")).getByText("Braucht eine Verbindung: Mailserver (SMTP)")).toBeInTheDocument();
    expect(within(screen.getAllByTestId("tool-spec-calculator")[0]).getByText("Funktioniert offline")).toBeInTheDocument();

    await userEvent.click(chips.getByRole("button", { name: "Daten" }));
    expect(chips.getByRole("button", { name: "Daten" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(shownTools()).toEqual(["text_statistics"]));
    await userEvent.click(chips.getByRole("button", { name: "Daten" }));
    expect(shownTools()).toEqual(["calculator", "text_statistics", "send_mail", "my_tool"]);

    await userEvent.click(chips.getByRole("button", { name: "Mit Internet" }));
    expect(shownTools()).toEqual(["send_mail"]);
    await userEvent.click(chips.getByRole("button", { name: "Mit Internet" }));

    await userEvent.click(chips.getByRole("button", { name: "Funktioniert offline" }));
    expect(shownTools()).toEqual(["calculator", "text_statistics"]);
    await userEvent.click(chips.getByRole("button", { name: "Funktioniert offline" }));

    await userEvent.click(chips.getByRole("button", { name: "Braucht eine Verbindung" }));
    expect(shownTools()).toEqual(["send_mail"]);
  });

  it("lets everything through without an active filter and nothing without a spec otherwise", () => {
    const none = { category: null, network: null, offline: false, connection: false };
    expect(matchesSpec(undefined, none)).toBe(true);
    expect(matchesSpec(undefined, { ...none, offline: true })).toBe(false);
    expect(matchesSpec(spec("calculator"), { ...none, category: "compute", network: "none", offline: true })).toBe(true);
    expect(matchesSpec(spec("calculator"), { ...none, connection: true })).toBe(false);
  });
});
