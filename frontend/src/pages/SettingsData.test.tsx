// Export and delete everything (N-15) and the secrets a restore could not bring along.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DELETE_ALL_CONFIRMATION, DataPanel, SecretsToReenter, rememberSecretsToReenter, rememberedSecretsToReenter, secretToReenter } from "./SettingsData";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const CONTENTS = {
  workflows: 3, versions: 4, templates: 1, runs: 9, knowledge_files: 0, memory_spaces: 1, memory_files: 2, tools: 0,
  usage_entries: 0, conversations: 0, input_files: 0,
};

function show(element: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("DataPanel", () => {
  it("offers the export as a download of the export route", () => {
    show(<DataPanel />);
    const link = screen.getByTestId("data-export");
    expect(link).toHaveAttribute("href", "/api/data/export");
    expect(link).toHaveAttribute("download");
  });

  it("deletes only after the exact confirmation, warns first and reports what is left", async () => {
    const fetch = vi.fn(async () =>
      json({ deleted_at: "2026-11-27T08:00:00Z", contents: CONTENTS, removed_entries: 12, complete: false, log_emptied: true, left: ["nodestro.db-wal"] }),
    );
    vi.stubGlobal("fetch", fetch);
    show(<DataPanel />);
    await userEvent.click(screen.getByTestId("data-delete-open"));
    expect(screen.getByText(/lässt sich nicht rückgängig machen/)).toBeInTheDocument();
    const submit = screen.getByTestId("data-delete-submit");
    expect(submit).toBeDisabled();
    // A translation or a near miss does not count: the API wants exactly this text.
    await userEvent.type(screen.getByTestId("data-delete-confirm"), "alle daten löschen");
    expect(submit).toBeDisabled();
    await userEvent.clear(screen.getByTestId("data-delete-confirm"));
    await userEvent.type(screen.getByTestId("data-delete-confirm"), DELETE_ALL_CONFIRMATION);
    expect(submit).toBeEnabled();
    expect(fetch).not.toHaveBeenCalled();
    await userEvent.click(submit);
    const done = await screen.findByTestId("data-deleted");
    expect(within(done).getByText("nodestro.db-wal")).toBeInTheDocument();
    expect(done).toHaveTextContent("Lösche noch einmal");
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/data/delete-all");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ confirm: "delete all data" });
  });

  it("says why it was refused while runs are active", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ detail: "busy", code: "data.busy", params: { work: ["runs"] } }, 409)),
    );
    show(<DataPanel />);
    await userEvent.click(screen.getByTestId("data-delete-open"));
    await userEvent.type(screen.getByTestId("data-delete-confirm"), DELETE_ALL_CONFIRMATION);
    await userEvent.click(screen.getByTestId("data-delete-submit"));
    expect(await screen.findByTestId("data-delete-error")).toHaveTextContent("Es sind noch Läufe oder andere Arbeiten im Hintergrund aktiv");
  });
});

describe("SecretsToReenter", () => {
  it("links each secret to where it is entered again and never shows anything but its label", () => {
    expect(secretToReenter("mcp:mcp_1")?.href).toBe("/tools?tab=services&server=mcp_1");
    expect(secretToReenter("connection:con_2")?.href).toBe("/tools?tab=connections&connection=con_2");
    expect(secretToReenter("provider:openai")?.href).toBe("/settings#provider-openai");
    expect(secretToReenter("token:abc")).toBeNull();
    const done = vi.fn();
    show(<SecretsToReenter labels={["mcp:mcp_1", "connection:con_2", "other:x"]} onDone={done} />);
    const list = screen.getByTestId("secrets-to-reenter");
    expect(list).toHaveTextContent("2 Geheimnisse neu eingeben");
    expect(within(screen.getByTestId("reenter-mcp-mcp_1")).getByRole("link")).toHaveAttribute("href", "/tools?tab=services&server=mcp_1");
    expect(within(screen.getByTestId("reenter-connection-con_2")).getByRole("link")).toHaveAttribute("href", "/tools?tab=connections&connection=con_2");
    expect(list).not.toHaveTextContent("other");
  });

  it("shows nothing without a known label", () => {
    const { container } = show(<SecretsToReenter labels={["other:x"]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the list over the reload after a restore", async () => {
    rememberSecretsToReenter(["mcp:mcp_1"]);
    expect(rememberedSecretsToReenter()).toEqual(["mcp:mcp_1"]);
    rememberSecretsToReenter([]);
    await waitFor(() => expect(rememberedSecretsToReenter()).toEqual([]));
  });
});
