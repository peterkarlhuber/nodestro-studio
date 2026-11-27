// Saving the memory assistant's proposal marks it as the assistant's text (N-24 L1): the server records the origin
// `assistant`, never `user` (German labels, as every component test).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { newNode } from "../lib/defaults";
import { MemoryAssistantDialog } from "./MemoryAssistantDialog";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MemoryAssistantDialog", () => {
  it("saves the proposal with the proposed marker", async () => {
    const seed = { files: [{ path: "/memories/kunden.md", content: "# Kunden" }], explanation: "Eine Datei je Thema." };
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/memory/propose") return json({ seed, cost_usd: null });
      if (url.startsWith("/api/memory/Team/file")) return json(JSON.parse(String(init?.body)));
      return json({ detail: "unexpected", code: "not_found", params: {} }, 404);
    });
    vi.stubGlobal("fetch", fetch);
    const agent = { ...newNode("agent", { x: 0, y: 0 }, { name: "Merker" }).agent!, name: "Merker" };
    const onSpace = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryAssistantDialog open onClose={() => undefined} agent={{ ...agent, memory: { ...agent.memory, space: "Team" } }} onSpace={onSpace} />
      </QueryClientProvider>,
    );
    await userEvent.type(screen.getByRole("textbox"), "Vorlieben der Kunden");
    await userEvent.click(screen.getByRole("button", { name: "Vorschlag erstellen" }));
    await userEvent.click(await screen.findByRole("button", { name: "In Raum speichern" }));
    await vi.waitFor(() => expect(onSpace).toHaveBeenCalledWith("Team"));
    const writes = fetch.mock.calls.filter(([url]) => String(url).startsWith("/api/memory/Team/file"));
    expect(writes.map(([url, init]) => [url, init?.method])).toEqual([["/api/memory/Team/file?proposed=true", "PUT"]]);
    expect(JSON.parse(String(writes[0][1]?.body))).toEqual({ path: "/memories/kunden.md", content: "# Kunden" });
  });
});
