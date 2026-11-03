import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ToolInfo } from "../api/types";
import i18n from "../i18n";

import { AdoptTool, AdoptedNote, PastedCodeWarning, adoptionChange, canAdopt } from "./ToolAdoption";

const CODE = "def double(x: int) -> int:\n    \"\"\"Double x.\"\"\"\n    return 2 * x\n";
const TESTS = "from tool import double\n\ndef test_double():\n    assert double(2) == 4\n";

const TOOL: ToolInfo = {
  name: "double",
  kind: "generated",
  trust: "untrusted",
  description: "Double x.",
  input_schema: null,
  version: 3,
  created_at: null,
  function_name: "double",
  code: CODE,
  tests: TESTS,
  requirement: "Double a number",
  content_hash: "a".repeat(64),
  adoption: null,
};

function wrap(children: ReactNode) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function serve(
  profile: string,
  adopt: (body: Record<string, unknown>) => Response = () => json({ ...TOOL }),
  settings: Record<string, unknown> = {},
) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/meta") return json({ profile });
    if (url === "/api/settings") return json(settings);
    if (url === "/api/auth/me") return json({ detail: "", code: "not_found", params: {} }, 404);
    if (url.endsWith("/adopt") && init?.method === "POST") return adopt(JSON.parse(String(init.body)));
    return json([]);
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const adoptions = (fetch: ReturnType<typeof vi.fn>) =>
  fetch.mock.calls.filter(([url, init]) => String(url).endsWith("/adopt") && (init as RequestInit)?.method === "POST");

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("canAdopt", () => {
  it("offers adoption only for AI-created code on the desktop to its owner", () => {
    expect(canAdopt(TOOL, "desktop", true)).toBe(true);
    expect(canAdopt(TOOL, "server", true)).toBe(false);
    expect(canAdopt(TOOL, "local-container", true)).toBe(false);
    expect(canAdopt(TOOL, "unknown", true)).toBe(false);
    expect(canAdopt(TOOL, "desktop", false)).toBe(false);
    expect(canAdopt({ ...TOOL, trust: "user-authored" }, "desktop", true)).toBe(false);
    expect(canAdopt({ ...TOOL, kind: "mcp" }, "desktop", true)).toBe(false);
    expect(canAdopt({ ...TOOL, content_hash: null }, "desktop", true)).toBe(false);
  });
});

const SELECTION = { mode: "auto" as const, profile: "desktop", os: "linux", arch: "x86_64", reason: "docker-unreachable", detail: "" };

describe("adoptionChange", () => {
  it("names where the tool runs now and where it runs once adopted", () => {
    expect(adoptionChange({ ...SELECTION, untrusted: "", user_authored: "subprocess", blocked: true })).toEqual({
      now: { key: "tools.adopt.change.nowBlocked", backend: "" },
      after: { key: "tools.adopt.change.after", backend: "subprocess" },
    });
    expect(adoptionChange({ ...SELECTION, untrusted: "docker", user_authored: "subprocess", blocked: false })?.now).toEqual({
      key: "tools.adopt.change.nowIsolated",
      backend: "docker",
    });
    expect(adoptionChange({ ...SELECTION, untrusted: "", user_authored: "", blocked: true })).toBeNull();
    expect(adoptionChange(undefined)).toBeNull();
  });
});

describe("AdoptTool", () => {
  it("says in the dialog what adopting changes on this computer", async () => {
    serve("desktop", undefined, { sandbox_selection: { ...SELECTION, untrusted: "", user_authored: "subprocess", blocked: true } });
    render(wrap(<AdoptTool tool={TOOL} />));
    await userEvent.click(await screen.findByTestId("tool-adopt"));
    expect(await screen.findByTestId("tool-adopt-now")).toHaveTextContent(i18n.t("tools.adopt.change.nowBlocked"));
    expect(screen.getByTestId("tool-adopt-after")).toHaveTextContent("Nach der Übernahme: Es läuft wie Code, den du selbst schreibst (Python-Prozess).");
  });

  it("shows the code, the tests and a warning, and adopts only after an explicit confirmation", async () => {
    const fetch = serve("desktop");
    render(wrap(<AdoptTool tool={TOOL} />));
    await userEvent.click(await screen.findByTestId("tool-adopt"));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(i18n.t("tools.adopt.warning"));
    expect(dialog).toHaveTextContent("return 2 * x");
    expect(dialog).toHaveTextContent("assert double(2) == 4");
    expect(dialog).toHaveTextContent(i18n.t("tools.adopt.intro", { version: 3 }));
    const confirm = screen.getByTestId("tool-adopt-confirm");
    expect(confirm).toBeDisabled();
    await userEvent.click(screen.getByTestId("tool-adopt-check"));
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await waitFor(() => expect(adoptions(fetch)).toHaveLength(1));
    const [url, init] = adoptions(fetch)[0];
    expect(url).toBe("/api/tools/double/adopt");
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ content_hash: "a".repeat(64) });
  });

  it("explains a refusal in the interface language", async () => {
    serve("desktop", () =>
      json({ detail: "changed", code: "tool.adoption_stale", params: { name: "double", version: 4 } }, 409),
    );
    render(wrap(<AdoptTool tool={TOOL} />));
    await userEvent.click(await screen.findByTestId("tool-adopt"));
    await userEvent.click(screen.getByTestId("tool-adopt-check"));
    await userEvent.click(screen.getByTestId("tool-adopt-confirm"));
    expect(
      await screen.findByText(i18n.t("errors.tool.adoption_stale", { version: 4 }), { exact: false }),
    ).toBeInTheDocument();
  });

  it.each(["server", "local-container"])("is not offered in the %s profile", async (profile) => {
    const fetch = serve(profile);
    render(wrap(<AdoptTool tool={TOOL} />));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/meta", expect.anything()));
    expect(screen.queryByTestId("tool-adopt")).toBeNull();
  });
});

describe("AdoptedNote", () => {
  it("says that the tool was adopted and what ends it", () => {
    render(
      wrap(
        <AdoptedNote
          tool={{
            ...TOOL,
            trust: "user-authored",
            adoption: {
              name: "double",
              version: 3,
              content_hash: "a".repeat(64),
              actor: "local",
              role: "owner",
              at: new Date().toISOString(),
            },
          }}
        />,
      ),
    );
    expect(screen.getByTestId("tool-trust")).toHaveTextContent(/Version 3/);
  });
});

describe("PastedCodeWarning", () => {
  it("warns clearly once code was pasted", () => {
    const { rerender } = render(wrap(<PastedCodeWarning pasted={false} />));
    expect(screen.queryByTestId("tool-pasted-warning")).toBeNull();
    expect(screen.getByText(i18n.t("tools.write.ownCodeNote"))).toBeInTheDocument();
    rerender(wrap(<PastedCodeWarning pasted />));
    expect(screen.getByTestId("tool-pasted-warning")).toHaveTextContent(i18n.t("tools.write.pastedWarning"));
  });
});
