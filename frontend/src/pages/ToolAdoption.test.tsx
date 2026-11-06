import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ToolInfo, ToolVersion } from "../api/types";
import i18n from "../i18n";

import { AdoptTool, AdoptedNote, PastedCodeWarning, adoptionChange, canAdopt, previousOwnVersion } from "./ToolAdoption";

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
  versions: () => Response = () => json([]),
) {
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/meta") return json({ profile });
    if (url === "/api/tools/double/versions") return versions();
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

const version = (number: number, author: ToolVersion["author"], code = CODE, tests = TESTS): ToolVersion => ({
  version: number,
  status: "approved",
  created_at: null,
  author,
  own: author !== "ai",
  description: "Double x.",
  function_name: "double",
  code,
  tests,
  content_hash: String(number).repeat(64),
});

const OWN_CODE = "def double(x: int) -> int:\n    \"\"\"Double x.\"\"\"\n    return x + x\n";

describe("previousOwnVersion", () => {
  it("is the newest own version before the one to adopt", () => {
    const history = [version(3, "ai"), version(2, "ai"), version(1, "editor")];
    expect(previousOwnVersion(history, 3)?.version).toBe(1);
    expect(previousOwnVersion([version(4, "editor"), version(2, "adopted"), version(1, "editor")], 3)?.version).toBe(2);
    expect(previousOwnVersion([version(3, "ai"), version(1, "ai")], 3)).toBeNull();
    expect(previousOwnVersion([{ ...version(1, "editor"), code: null }], 3)).toBeNull();
    expect(previousOwnVersion([], 3)).toBeNull();
  });
});

describe("AdoptTool: changes since the person's own version (ST-036)", () => {
  it("shows what the AI changed against the last version written in the editor", async () => {
    serve("desktop", undefined, {}, () => json([version(3, "ai"), version(2, "ai", "x = 1\n"), version(1, "editor", OWN_CODE)]));
    render(wrap(<AdoptTool tool={TOOL} />));
    await userEvent.click(await screen.findByTestId("tool-adopt"));
    const diff = await screen.findByTestId("tool-adopt-diff");
    expect(diff).toHaveTextContent(i18n.t("tools.adopt.diff.title", { version: 1 }));
    expect(diff).toHaveTextContent(i18n.t("tools.adopt.diff.intro.editor", { previous: 1, version: 3 }));
    expect(screen.getByRole("region", { name: i18n.t("tools.adopt.diff.title", { version: 1 }) })).toBe(diff);
    const lines = [...diff.querySelectorAll(".diff__line")].map((line) => [line.className.replace("diff__line diff__line--", ""), line.textContent]);
    expect(lines).toContainEqual(["removed", expect.stringContaining("return x + x")]);
    expect(lines).toContainEqual(["added", expect.stringContaining("return 2 * x")]);
    expect(diff).toHaveTextContent(i18n.t("tools.adopt.diff.testsUnchanged"));
    // The full code stays below, and the confirmation still names exactly the version shown.
    expect(screen.getByRole("dialog")).toHaveTextContent(i18n.t("tools.adopt.intro", { version: 3 }));
  });

  it("names an adopted version and diffs changed tests", async () => {
    serve("desktop", undefined, {}, () => json([version(3, "ai"), version(2, "adopted", CODE, "def test_nothing():\n    pass\n")]));
    render(wrap(<AdoptTool tool={TOOL} />));
    await userEvent.click(await screen.findByTestId("tool-adopt"));
    const diff = await screen.findByTestId("tool-adopt-diff");
    expect(diff).toHaveTextContent(i18n.t("tools.adopt.diff.intro.adopted", { previous: 2, version: 3 }));
    expect(diff).not.toHaveTextContent(i18n.t("tools.adopt.diff.testsUnchanged"));
    expect(diff).toHaveTextContent("def test_nothing():");
  });

  it("says when there is nothing to compare, or when the history could not be read", async () => {
    serve("desktop", undefined, {}, () => json([version(3, "ai"), version(1, "ai")]));
    render(wrap(<AdoptTool tool={TOOL} />));
    await userEvent.click(await screen.findByTestId("tool-adopt"));
    expect(await screen.findByTestId("tool-adopt-diff-none")).toHaveTextContent(i18n.t("tools.adopt.diff.none"));
    cleanup();
    serve("desktop", undefined, {}, () => json({ detail: "x", code: "http.500", params: {} }, 500));
    render(wrap(<AdoptTool tool={TOOL} />));
    await userEvent.click(await screen.findByTestId("tool-adopt"));
    expect(await screen.findByTestId("tool-adopt-diff-unavailable")).toHaveTextContent(i18n.t("tools.adopt.diff.unavailable"));
    // Adopting stays possible: the full code is shown either way.
    await userEvent.click(screen.getByTestId("tool-adopt-check"));
    expect(screen.getByTestId("tool-adopt-confirm")).toBeEnabled();
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
