// Memory entries with their origin and time (N-24): each file of a space shows who wrote it last (an agent, the
// person, the memory assistant, an import, or unknown) and when (German labels, as every component test).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MemoryFile } from "../api/types";
import { MemoryPage } from "./MemoryPage";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const FILES: MemoryFile[] = [
  { path: "/memories/agent.md", size: 3, origin: "tool", updated_at: "2026-11-27T10:00:00Z", scope: "user" },
  { path: "/memories/mine.md", size: 4, origin: "user", updated_at: "2026-11-27T11:00:00Z", scope: "user" },
  { path: "/memories/old.md", size: 5, origin: null, updated_at: "2026-01-02T03:04:05Z", scope: "user" },
  { path: "/memories/plan.md", size: 6, origin: "assistant", updated_at: "2026-11-27T12:00:00Z", scope: "user" },
];

function serve() {
  const fetch = vi.fn(async (url: string) => {
    if (url === "/api/memory") return json([{ name: "Team", files: 4, size: 18, scope: "user" }]);
    if (url === "/api/memory/Team") return json(FILES);
    if (url.startsWith("/api/memory/Team/file")) return json({ path: "/memories/agent.md", content: "tea" });
    if (url === "/api/meta") return json({ profile: "desktop" });
    return json({ detail: "unexpected", code: "not_found", params: {} }, 404);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MemoryPage entries", () => {
  it("shows who wrote each entry last", async () => {
    serve();
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <MemoryPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const agent = await screen.findByRole("button", { name: /^\/memories\/agent\.md/ });
    expect(agent.textContent).toContain("von einem Agenten geschrieben");
    expect(screen.getByRole("button", { name: /^\/memories\/mine\.md/ }).textContent).toContain("von dir geschrieben");
    expect(screen.getByRole("button", { name: /^\/memories\/old\.md/ }).textContent).toContain("Herkunft unbekannt");
    const plan = screen.getByRole("button", { name: /^\/memories\/plan\.md/ }).textContent;
    expect(plan).toContain("vom Memory-Assistenten vorgeschlagen");
    expect(plan).not.toContain("von dir geschrieben");
  });
});
