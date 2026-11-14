// The Skills page (NAL-B3): the list, the import with its dry run, validation report and security note, and the
// refused delete of a skill that agents still use.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Skill, SkillCheck, SkillDetail } from "../api/skills";
import { SkillsPage, matchingSkills } from "./SkillsPage";

const skill = (patch: Partial<Skill>): Skill => ({
  id: "sk_1",
  name: "pdf-summary",
  description: "Summarizes PDF reports.",
  status: "active",
  version: 2,
  language: "en",
  origin: "user",
  has_scripts: false,
  created_at: "2026-11-01T10:00:00Z",
  updated_at: "2026-11-02T10:00:00Z",
  ...patch,
});

const SKILLS = [
  skill({}),
  skill({ id: "sk_2", name: "web-research", description: "Finds sources on the web.", origin: "import:abc", has_scripts: true, version: 1 }),
];

const detail = (item: Skill): SkillDetail => ({
  skill: item,
  version: {
    skill_id: item.id,
    version: item.version,
    digest: "d",
    name: item.name,
    description: item.description,
    license: null,
    compatibility: null,
    metadata: {},
    allowed_tools: null,
    files: [{ path: "SKILL.md", size: 120, sha256: "x" }],
    origin: item.origin,
    note: "",
    created_at: item.updated_at,
    created_by: "local",
  },
  body: "Read the PDF and <b>summarize</b> it.",
  files: [{ path: "SKILL.md", size: 120, text: true, script: false }],
  issues: [],
});

const check = (patch: Partial<SkillCheck>): SkillCheck => ({
  name: "Bad Name",
  description: "Does things.",
  license: null,
  compatibility: null,
  metadata: {},
  allowed_tools: null,
  body: "Step 1: do it.",
  files: [
    { path: "SKILL.md", size: 80, text: true, script: false },
    { path: "scripts/run.py", size: 40, text: true, script: true },
  ],
  issues: [
    { severity: "error", code: "skill.name_invalid", message: "bad name", path: "SKILL.md", field: "name", params: {} },
    { severity: "warning", code: "skill.scripts_not_run", message: "scripts", path: "scripts/", field: null, params: {} },
  ],
  existing: null,
  ...patch,
});

let checked: SkillCheck;
const imports: FormData[] = [];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  imports.length = 0;
  checked = check({});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace(/\?.*$/, "");
      const method = init?.method ?? "GET";
      if (path === "/api/skills") return json(SKILLS);
      if (path === "/api/skills/import") {
        const form = init!.body as FormData;
        imports.push(form);
        if (form.get("dry_run")) return json({ skill: null, check: checked });
        return json({ skill: skill({ id: "sk_9", name: checked.name, version: 3 }), check: checked });
      }
      const match = /^\/api\/skills\/(sk_\d)(\/\w+)?$/.exec(path);
      if (match) {
        const found = SKILLS.find((item) => item.id === match[1])!;
        if (method === "DELETE")
          return json({ detail: "The skill is used by agents; archive it instead", code: "skill.in_use", params: { count: 2 } }, 409);
        if (match[2] === "/versions") return json([detail(found).version]);
        if (match[2] === "/usage") return json([]);
        return json(detail(found));
      }
      if (path === "/api/auth/me") return json({ detail: "Not Found" }, 404);
      return json({});
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function showPage(entry = "/skills") {
  const router = createMemoryRouter([{ path: "/skills", element: <SkillsPage /> }], { initialEntries: [entry] });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

async function chooseFile() {
  await userEvent.click(await screen.findByRole("button", { name: "Skill importieren" }));
  const input = screen.getByTestId("skill-import-file");
  fireEvent.change(input, { target: { files: [new File(["---\nname: x\n---\n"], "SKILL.md", { type: "text/markdown" })] } });
  return screen.findByTestId("skill-import-report");
}

describe("skill list", () => {
  it("shows name, description, status, version, origin and the scripts badge, and filters by search", async () => {
    showPage();
    expect(await screen.findByRole("heading", { name: "pdf-summary" })).toBeInTheDocument();
    const imported = screen.getByRole("heading", { name: "web-research" }).closest("article")!;
    expect(within(imported).getByText("Finds sources on the web.")).toBeInTheDocument();
    expect(within(imported).getByText("Importiert")).toBeInTheDocument();
    expect(within(imported).getByText("Enthält Skripte (nie ausgeführt)")).toBeInTheDocument();
    expect(within(imported).getByText("Aktiv")).toBeInTheDocument();
    expect(within(imported).getByText("Version 1")).toBeInTheDocument();

    await userEvent.type(screen.getByRole("searchbox"), "sources web");
    expect(screen.queryByRole("heading", { name: "pdf-summary" })).toBeNull();
    expect(screen.getByRole("heading", { name: "web-research" })).toBeInTheDocument();
  });

  it("matches every word of the query in name or description", () => {
    expect(matchingSkills(SKILLS, "PDF reports").map((item) => item.id)).toEqual(["sk_1"]);
    expect(matchingSkills(SKILLS, "")).toHaveLength(2);
  });

  it("opens the skill named in ?skill= (e.g. after copying one from the library)", async () => {
    showPage("/skills?skill=sk_2");
    const panel = await screen.findByTestId("skill-detail");
    expect(within(panel).getByRole("heading", { name: "web-research" })).toBeInTheDocument();
  });

  it("shows the instructions as text, never as HTML", async () => {
    showPage();
    await userEvent.click(await screen.findByRole("button", { name: /pdf-summary/ }));
    const body = await screen.findByTestId("skill-body");
    expect(body.textContent).toBe("Read the PDF and <b>summarize</b> it.");
    expect(body.querySelector("b")).toBeNull();
  });
});

describe("import", () => {
  it("checks the file first and shows the report, the preview and the security note", async () => {
    showPage();
    const report = await chooseFile();
    expect(imports).toHaveLength(1);
    expect(imports[0].get("dry_run")).toBe("true");
    expect(within(report).getByText("1 Fehler verhindert den Import. Behebe ihn in der Datei und wähle sie erneut.")).toBeInTheDocument();
    expect(within(report).getByText(/Der Name darf nur Kleinbuchstaben/)).toBeInTheDocument();
    expect(within(report).getByText("Der Skill enthält Skripte. Sie bleiben erhalten, werden aber nie ausgeführt.")).toBeInTheDocument();
    expect(screen.getByTestId("skill-import-security")).toHaveTextContent(/unbekannten Quelle.*nicht vertrauenswürdigen Inhalt.*nie ausgeführt/);
    expect(screen.getByTestId("skill-import-body")).toHaveTextContent("Step 1: do it.");
    // An error blocks the import.
    expect(screen.getByRole("button", { name: "Importieren" })).toBeDisabled();
  });

  it("stores a file with the name of an existing skill as its next version", async () => {
    checked = check({ name: "pdf-summary", issues: [], existing: SKILLS[0] });
    showPage();
    await chooseFile();
    expect(screen.getByTestId("skill-import-existing")).toHaveTextContent("„pdf-summary“");
    await userEvent.click(screen.getByRole("button", { name: "Als neue Version von pdf-summary speichern" }));
    await waitFor(() => expect(imports).toHaveLength(2));
    expect(imports[1].get("dry_run")).toBeNull();
    expect(imports[1].get("skill_id")).toBe("sk_1");
  });
});

describe("delete", () => {
  it("tells the user to archive a skill that agents still use", async () => {
    showPage();
    await userEvent.click(await screen.findByRole("button", { name: /pdf-summary/ }));
    await screen.findByTestId("skill-detail");
    await userEvent.click(screen.getByRole("button", { name: "Skill löschen" }));
    await userEvent.click(screen.getByRole("button", { name: /^Skill löschen:/ }));
    const note = await screen.findByTestId("skill-in-use");
    expect(note).toHaveTextContent("Agenten verwenden diesen Skill noch (2), daher kann er nicht gelöscht werden. Archiviere ihn stattdessen");
    expect(within(note).getByRole("button", { name: "Archivieren" })).toBeInTheDocument();
  });
});
