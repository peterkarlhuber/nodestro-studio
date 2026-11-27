// Import and export of exchange files (N-14): preview first, apply after confirming, never a secret value.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ImportReport } from "../api/exchange";
import { PlatformHelp } from "../lib/platformHelp";
import { ExportButton, ImportButton } from "./ExchangeDialog";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function report(overrides: Partial<ImportReport> = {}): ImportReport {
  return {
    format: "nodestro-mcp/1",
    dry_run: true,
    items: [
      { kind: "mcp_server", name: "Tickets", status: "ready", code: null, params: {}, id: null, needs_secret: true },
      { kind: "mcp_server", name: "Wiki", status: "ready", code: null, params: {}, id: null, needs_secret: false },
    ],
    secrets_to_reenter: [],
    left_out: ["enabled", "tool_approvals", "secrets"],
    collection: null,
    collection_exists: false,
    embedding: null,
    ...overrides,
  };
}

function show(element: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
      <MemoryRouter>
        <PlatformHelp>{element}</PlatformHelp>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const file = (name: string, content = '{"format":"nodestro-mcp/1","servers":[]}') => new File([content], name, { type: "application/json" });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ImportButton", () => {
  it("previews the file, applies it only after confirming and lists the secrets to enter again", async () => {
    const applied = report({
      dry_run: false,
      items: [
        { kind: "mcp_server", name: "Tickets", status: "created", code: null, params: {}, id: "mcp_1", needs_secret: true },
        { kind: "mcp_server", name: "Wiki", status: "created", code: null, params: {}, id: "mcp_2", needs_secret: false },
      ],
      secrets_to_reenter: ["mcp:mcp_1"],
    });
    const fetch = vi.fn(async (url: string) => json(url.includes("dry_run=true") ? report() : applied));
    vi.stubGlobal("fetch", fetch);
    const onImported = vi.fn();
    show(<ImportButton kind="mcp" onImported={onImported} />);
    await userEvent.click(screen.getByTestId("exchange-import-mcp"));
    const chosen = file("services.nodestro-mcp.json");
    await userEvent.upload(screen.getByTestId("exchange-file"), chosen);
    const preview = await screen.findByTestId("exchange-report");
    expect(within(preview).getByText("Tickets")).toBeInTheDocument();
    expect(within(preview).getAllByTestId("exchange-item-ready")).toHaveLength(2);
    expect(within(preview).getByTestId("exchange-left-out")).toHaveTextContent("Tool-Freigaben");
    // The raw file is the body of the dry run; nothing was stored yet.
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/mcp/import?dry_run=true");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(chosen);
    expect(onImported).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("exchange-apply"));
    await screen.findByTestId("exchange-done");
    expect(fetch.mock.calls[1][0]).toBe("/api/mcp/import?dry_run=false");
    expect(onImported).toHaveBeenCalledWith(applied);
    const secrets = screen.getByTestId("secrets-to-reenter");
    expect(within(secrets).getByRole("link")).toHaveAttribute("href", "/tools?tab=services&server=mcp_1");
    expect(secrets).toHaveTextContent("bringen ihre Geheimnisse nie mit");
  });

  it("names why an entry is refused and does not offer to apply", async () => {
    const refused = report({
      items: [
        { kind: "connection", name: "Mail", status: "refused", code: "exchange.unsafe_path", params: { name: "../x" }, id: null, needs_secret: false },
      ],
    });
    vi.stubGlobal("fetch", vi.fn(async () => json(refused)));
    show(<ImportButton kind="connections" />);
    await userEvent.click(screen.getByTestId("exchange-import-connections"));
    await userEvent.upload(screen.getByTestId("exchange-file"), file("c.json"));
    expect(await screen.findByTestId("exchange-refusal")).toHaveTextContent("unsicheren Pfad (../x)");
    expect(screen.getByTestId("exchange-apply")).toBeDisabled();
  });

  it("explains a refused file in words, with the shared help of the exchange files", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ detail: "newer", code: "exchange.version_newer", params: { version: 2, supported: 1 } }, 422)),
    );
    show(<ImportButton kind="mcp" />);
    await userEvent.click(screen.getByTestId("exchange-import-mcp"));
    await userEvent.upload(screen.getByTestId("exchange-file"), file("new.json"));
    expect(await screen.findByText(/neueren Nodestro-Version \(Version 2; diese liest bis Version 1\)/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Hilfe: Austauschdateien/ }).length).toBeGreaterThan(0);
  });

  it("sends a collection as a form with the chosen name and checks again after a rename", async () => {
    const forms: FormData[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const form = init.body as FormData;
        forms.push(form);
        const name = (form.get("collection") as string | null) ?? "Contracts";
        return json(
          report({
            format: "nodestro-collection/1",
            dry_run: form.get("dry_run") === "true",
            items: [{ kind: "document", name: "a.pdf", status: "ready", code: null, params: {}, id: null, needs_secret: false }],
            collection: name,
            collection_exists: name === "Contracts",
            embedding: { package: null, workspace: null, matches: false },
          }),
        );
      }),
    );
    show(<ImportButton kind="collection" />);
    await userEvent.click(screen.getByTestId("exchange-import-collection"));
    await userEvent.upload(screen.getByTestId("exchange-file"), new File(["PK"], "contracts.nodestro-collection.zip"));
    expect(await screen.findByText(/Die Sammlung Contracts enthält bereits Dateien/)).toBeInTheDocument();
    expect(forms[0].get("dry_run")).toBe("true");
    const name = screen.getByLabelText("Sammlung");
    await userEvent.clear(name);
    await userEvent.type(name, "Contracts 2026");
    // Previewed under another name: check again before applying.
    expect(screen.getByTestId("exchange-apply")).toBeDisabled();
    await userEvent.click(screen.getByTestId("exchange-recheck"));
    await waitFor(() => expect(screen.getByTestId("exchange-apply")).toBeEnabled());
    await userEvent.click(screen.getByTestId("exchange-apply"));
    await screen.findByTestId("exchange-done");
    expect(forms.at(-1)?.get("collection")).toBe("Contracts 2026");
    expect(forms.at(-1)?.get("dry_run")).toBe("false");
  });
});

describe("ExportButton", () => {
  it("downloads the file under the name the API gives", async () => {
    const clicked: string[] = [];
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: () => undefined }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this.download);
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { headers: { "Content-Disposition": 'attachment; filename="connections.nodestro-connection.json"' } })),
    );
    show(<ExportButton kind="connections" />);
    await userEvent.click(screen.getByTestId("exchange-export-connections"));
    await waitFor(() => expect(clicked).toEqual(["connections.nodestro-connection.json"]));
    click.mockRestore();
  });

  it("needs a collection to export one", () => {
    show(<ExportButton kind="collection" />);
    expect(screen.getByTestId("exchange-export-collection")).toBeDisabled();
  });
});
