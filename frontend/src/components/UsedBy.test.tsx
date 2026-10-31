import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Trash2 } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReferenceUser } from "../api/types";
import { DeleteUsed, UsedByList, useUsedBy, userLink } from "./UsedBy";

const user = (extra: Partial<ReferenceUser>): ReferenceUser => ({
  kind: "workflow",
  id: "wf_1",
  name: "Vertragsprüfung",
  node_id: "reviewer",
  node_label: "Prüfer",
  role: "agent",
  release: null,
  workflow_id: null,
  ...extra,
});

const USERS = [
  user({}),
  user({ node_id: "start", node_label: "Start", role: "start" }),
  user({ kind: "template", id: "tpl_1", name: "Juristin", node_id: null, node_label: null }),
  user({ kind: "publication", id: "pub_1", name: "Prüf-API", node_id: null, node_label: null, release: 2, workflow_id: "wf_1" }),
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("used in", () => {
  it("names every user with a link to it", () => {
    render(
      <MemoryRouter>
        <UsedByList users={USERS} loaded />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Vertragsprüfung / Prüfer",
      "Vertragsprüfung / Start (Datei für jede Ausführung)",
      "Agenten-Bibliothek: Juristin",
      "Veröffentlichte API Prüf-API (v2)",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/workflows/wf_1?node=reviewer",
      "/workflows/wf_1?node=start",
      "/agents?template=tpl_1",
      "/workflows/wf_1",
    ]);
  });

  it("says when nothing uses the object, and nothing while it loads", () => {
    const { rerender } = render(<UsedByList users={[]} loaded={false} />);
    expect(screen.queryByText("Nirgends verwendet.")).toBeNull();
    rerender(<UsedByList users={[]} loaded />);
    expect(screen.getByText("Nirgends verwendet.")).toBeTruthy();
  });

  it("keeps the two-step button for an unused object", async () => {
    const onConfirm = vi.fn();
    render(<DeleteUsed kind="knowledge" icon={Trash2} label="vertrag.pdf löschen" title="vertrag.pdf löschen" users={[]} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "vertrag.pdf löschen" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /vertrag\.pdf löschen: / }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("names the users before a used object is deleted", async () => {
    const onConfirm = vi.fn();
    render(
      <MemoryRouter>
        <DeleteUsed kind="knowledge" icon={Trash2} label="vertrag.pdf löschen" title="vertrag.pdf löschen" users={USERS} onConfirm={onConfirm} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole("button", { name: "vertrag.pdf löschen" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("Wird an 4 Stellen verwendet:");
    expect(dialog.textContent).toContain("Vertragsprüfung / Prüfer");
    expect(dialog.textContent).toContain("Veröffentlichte API Prüf-API (v2)");
    expect(dialog.textContent).toContain("erhalten die Datei aber nicht mehr");
    await userEvent.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "vertrag.pdf löschen" }));
    await userEvent.click(screen.getByRole("button", { name: "Trotzdem löschen" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("asks the API once per kind and finds the users of one object", async () => {
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify([{ ref: "calculator", users: [USERS[0]] }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetch);
    function Probe() {
      const usedBy = useUsedBy("tool");
      return (
        <span>
          {usedBy.loaded ? `${usedBy.usersOf("calculator").length}/${usedBy.usersOf("other").length}` : "loading"}
        </span>
      );
    }
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Probe />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText("1/0")).toBeTruthy());
    expect(fetch).toHaveBeenCalledOnce();
    expect(String((fetch.mock.calls[0] as unknown[])[0])).toContain("/api/used-by?kind=tool");
  });

  it("links a publication to its workflow", () => {
    expect(userLink(USERS[3])).toBe("/workflows/wf_1");
  });
});
