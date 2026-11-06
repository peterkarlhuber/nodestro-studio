// New agent defaults (ST-015, ED-22): "Empty template" saves only on Save; a task that is only {{input}} shows as a chip.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgentConfig, AgentTemplate } from "../api/types";
import { TaskTemplateInput } from "../editor/TaskTemplateInput";
import { AgentsPage } from "./AgentsPage";

vi.mock("../components/CodeEditor", () => ({ CodeEditor: () => null }));

const posted: AgentConfig[] = [];
let templates: AgentTemplate[] = [];

beforeEach(() => {
  posted.length = 0;
  templates = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace(/\?.*$/, "");
      let body: unknown = [];
      if (path.endsWith("/agents/templates") && init?.method === "POST") {
        const agent = (JSON.parse(String(init.body)) as { agent: AgentConfig }).agent;
        posted.push(agent);
        const template = { id: "tpl_1", agent, created_at: "2026-11-06T10:00:00Z", updated_at: "2026-11-06T10:00:00Z" } as AgentTemplate;
        templates = [template];
        body = template;
      } else if (path.endsWith("/agents/templates")) body = templates;
      else if (path.endsWith("/meta")) body = { providers: [], capabilities: [], models: [] };
      else if (path.endsWith("/settings")) body = { providers: [], default_model: "claude-sonnet-5-5", assistant_model: "claude-opus-5-5" };
      else if (path.endsWith("/organize")) body = {};
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function showPage() {
  const router = createMemoryRouter([{ path: "/agents", element: <AgentsPage /> }], { initialEntries: ["/agents"] });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("Empty template (ED-22)", () => {
  it("opens an unsaved form and creates the template only on Save", async () => {
    showPage();
    await userEvent.click(await screen.findByRole("button", { name: "Leere Vorlage" }));
    expect(await screen.findByText("Neue Vorlage: Sie kommt beim Speichern in die Bibliothek.")).toBeInTheDocument();
    expect(posted).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].name).toBe("Neue Vorlage");
    await waitFor(() => expect(screen.queryByText(/Sie kommt beim Speichern/)).toBeNull());
  });

  it("cancelling a new template leaves the library unchanged", async () => {
    showPage();
    await userEvent.click(await screen.findByRole("button", { name: "Leere Vorlage" }));
    await userEvent.click(await screen.findByRole("button", { name: "Abbrechen" }));
    expect(screen.queryByText(/Sie kommt beim Speichern/)).toBeNull();
    expect(posted).toEqual([]);
  });
});

describe("task placeholder chip (ED-22)", () => {
  it("shows {{input}} as a chip and switches to the text and back", async () => {
    const onChange = vi.fn();
    render(<TaskTemplateInput id="task" value="{{input}}" onChange={onChange} />);
    expect(screen.getByText("Ergebnisse der vorherigen Schritte")).toHaveAttribute("title", "{{input}}");
    expect(screen.queryByRole("textbox")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Aufgabe formulieren" }));
    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(screen.getByRole("textbox")).toHaveValue("{{input}}");
    await userEvent.click(screen.getByRole("button", { name: "Als Platzhalter zeigen" }));
    expect(screen.getByTestId("task-chip")).toBeInTheDocument();
  });

  it("shows any other task as text", () => {
    render(<TaskTemplateInput id="task" value="Fasse {{input}} zusammen." onChange={() => undefined} />);
    expect(screen.getByRole("textbox")).toHaveValue("Fasse {{input}} zusammen.");
    expect(screen.queryByTestId("task-chip")).toBeNull();
  });
});
