// The Skills page (NAL-B3): the list, the import with its dry run, validation report and security note, and the
// refused delete of a skill that agents still use; skill groups, the usage table and turning a script into a tool
// (NAL-B4).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Skill, SkillCheck, SkillDetail, SkillGroup, SkillStats } from "../api/skills";
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
  files: [
    { path: "SKILL.md", size: 120, text: true, script: false },
    ...(item.has_scripts ? [{ path: "scripts/convert.py", size: 300, text: true, script: true }] : []),
  ],
  issues: [],
});

const GROUP: SkillGroup = {
  id: "grp_1",
  name: "research",
  description: "Everything for research.",
  skill_ids: ["sk_2"],
  created_at: "2026-11-01T10:00:00Z",
  updated_at: "2026-11-02T10:00:00Z",
};

const STATS: SkillStats[] = [
  {
    name: "web-research",
    offered: 12,
    loaded: 9,
    files_read: 4,
    runs: 8,
    succeeded: 6,
    failed: 2,
    checks_passed: 3,
    checks: 4,
    recommended: 1,
    versions: [1],
    last_used: "2026-11-10T09:00:00Z",
  },
  {
    name: "pdf-summary",
    offered: 2,
    loaded: 0,
    files_read: 0,
    runs: 0,
    succeeded: 0,
    failed: 0,
    checks_passed: 0,
    checks: 0,
    recommended: 0,
    versions: [],
    last_used: null,
  },
];

const TOOL_JOB = {
  id: "job_1",
  requirement: "Convert units",
  status: "running",
  message: "",
  message_code: "",
  message_params: {},
  attempts: [],
  approval: null,
  dependency_plan: null,
  dependencies: [],
  tool_name: null,
  origin: "skill:web-research@1/scripts/convert.py",
  error: null,
  cost_usd: null,
  created_at: "2026-11-14T10:00:00Z",
  finished_at: null,
};

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
/** The writes to the API besides imports: method, path (with query) and body. */
const calls: { method: string; url: string; body: unknown }[] = [];
let groups: SkillGroup[];
let draftError: { status: number; body: unknown } | null;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  imports.length = 0;
  calls.length = 0;
  checked = check({});
  groups = [GROUP];
  draftError = null;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace(/\?.*$/, "");
      const method = init?.method ?? "GET";
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
      if (method !== "GET" && path !== "/api/skills/import") calls.push({ method, url, body });
      if (path === "/api/skills") return json(SKILLS);
      if (path === "/api/skill-groups") {
        if (method === "POST") {
          if (body.name === "research") return json({ detail: "taken", code: "skill.group_name_taken", params: { name: "research" } }, 409);
          const created = { ...GROUP, ...body, id: "grp_2" };
          groups = [...groups, created];
          return json(created, 201);
        }
        return json(groups);
      }
      const group = /^\/api\/skill-groups\/(grp_\d)$/.exec(path);
      if (group) {
        if (method === "DELETE") {
          groups = groups.filter((item) => item.id !== group[1]);
          return new Response(null, { status: 204 });
        }
        const updated = { ...GROUP, ...body, id: group[1] };
        groups = groups.map((item) => (item.id === group[1] ? updated : item));
        return json(updated);
      }
      if (path === "/api/skill-stats") return json(url.endsWith("days=7") ? STATS.slice(0, 1) : STATS);
      if (/\/script-draft$/.test(path)) return draftError ? json(draftError.body, draftError.status) : json(TOOL_JOB, 201);
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

describe("groups", () => {
  async function showGroups() {
    showPage();
    await userEvent.click(await screen.findByRole("radio", { name: "Gruppen" }));
    return screen.findByTestId("skill-groups");
  }

  it("lists the groups with their skills", async () => {
    const area = await showGroups();
    const card = await within(area).findByRole("article", { name: "Gruppe research" });
    expect(within(card).getByText("Everything for research.")).toBeInTheDocument();
    expect(within(card).getByText("1 Skill")).toBeInTheDocument();
    await userEvent.click(within(card).getByRole("button", { name: "web-research" }));
    expect(await screen.findByTestId("skill-detail")).toBeInTheDocument();
  });

  it("creates a group with the chosen skills and shows a name that is taken", async () => {
    const area = await showGroups();
    await within(area).findByRole("article", { name: "Gruppe research" });
    await userEvent.click(within(area).getByRole("button", { name: "Neue Gruppe" }));
    const dialog = await screen.findByRole("dialog", { name: "Neue Skill-Gruppe" });
    await userEvent.type(within(dialog).getByRole("textbox", { name: "Name" }), "research");
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "pdf-summary" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Gruppe anlegen" }));
    expect(await within(dialog).findByText("Eine Skill-Gruppe namens „research“ existiert schon. Wähle einen anderen Namen.")).toBeInTheDocument();

    await userEvent.clear(within(dialog).getByRole("textbox", { name: "Name" }));
    await userEvent.type(within(dialog).getByRole("textbox", { name: "Name" }), "reports");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gruppe anlegen" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(calls.at(-1)).toEqual({
      method: "POST",
      url: "/api/skill-groups",
      body: { name: "reports", description: "", skill_ids: ["sk_1"] },
    });
    expect(await within(area).findByRole("article", { name: "Gruppe reports" })).toBeInTheDocument();
  });

  it("edits the members of a group and deletes it", async () => {
    const area = await showGroups();
    const card = await within(area).findByRole("article", { name: "Gruppe research" });
    await userEvent.click(within(card).getByRole("button", { name: "Bearbeiten" }));
    const dialog = await screen.findByRole("dialog", { name: "Gruppe research bearbeiten" });
    expect(within(dialog).getByRole("checkbox", { name: "web-research" })).toBeChecked();
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "pdf-summary" }));
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "web-research" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Speichern" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(calls.at(-1)).toEqual({
      method: "PUT",
      url: "/api/skill-groups/grp_1",
      body: { name: "research", description: "Everything for research.", skill_ids: ["sk_1"] },
    });

    await userEvent.click(within(card).getByRole("button", { name: "Gruppe research löschen" }));
    await userEvent.click(await screen.findByRole("button", { name: /^Gruppe research löschen:/ }));
    await waitFor(() => expect(within(area).queryByRole("article", { name: "Gruppe research" })).toBeNull());
    expect(calls.at(-1)).toMatchObject({ method: "DELETE", url: "/api/skill-groups/grp_1" });
  });
});

describe("usage", () => {
  it("shows how skills were used, as an indication, and changes the period", async () => {
    showPage();
    await userEvent.click(await screen.findByRole("radio", { name: "Nutzung" }));
    const area = await screen.findByTestId("skill-stats");
    expect(within(area).getByText(/ein Hinweis, kein Beweis/)).toBeInTheDocument();
    const row = (await within(area).findByRole("button", { name: "web-research" })).closest("tr")!;
    const cells = [...row.querySelectorAll("td")].map((cell) => cell.textContent);
    expect(cells.slice(0, 6)).toEqual(["12", "9", "8", "75\u00a0%", "3 / 4", "1"]);
    const unused = within(area).getByRole("button", { name: "pdf-summary" }).closest("tr")!;
    expect([...unused.querySelectorAll("td")].map((cell) => cell.textContent)).toEqual(["2", "0", "0", "–", "–", "0", "–"]);

    await userEvent.click(within(area).getByRole("radio", { name: "Letzte 7 Tage" }));
    await waitFor(() => expect(within(area).queryByRole("button", { name: "pdf-summary" })).toBeNull());
  });
});

describe("script as tool", () => {
  async function openDialog() {
    showPage("/skills?skill=sk_2");
    const panel = await screen.findByTestId("skill-detail");
    await userEvent.click(within(panel).getByRole("button", { name: "scripts/convert.py als Tool nutzen" }));
    return screen.findByRole("dialog", { name: "scripts/convert.py als Tool nutzen" });
  }

  it("explains the steps, starts a tool job for the script and links to it", async () => {
    const dialog = await openDialog();
    expect(within(dialog).getByTestId("script-tool-steps")).toHaveTextContent(/Coding Agent.*isolierenden Docker-Sandbox.*gibt das Tool frei/);
    expect(within(dialog).getByText(/Das Skript selbst wird nie ausgeführt/)).toBeInTheDocument();
    await userEvent.type(within(dialog).getByRole("textbox", { name: /Hinweis für den Coding Agent/ }), "Return SI units");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tool schreiben lassen" }));
    const started = await within(dialog).findByTestId("script-tool-started");
    expect(calls.at(-1)).toEqual({
      method: "POST",
      url: "/api/skills/sk_2/versions/1/script-draft",
      body: { path: "scripts/convert.py", note: "Return SI units" },
    });
    expect(within(started).getByRole("link", { name: /Tool-Aufträge öffnen/ })).toHaveAttribute("href", "/tools?tab=generate");
  });

  it("shows why nothing started without isolation", async () => {
    draftError = {
      status: 400,
      body: { detail: "isolation required", code: "sandbox.isolation_required", params: {} },
    };
    const dialog = await openDialog();
    await userEvent.click(within(dialog).getByRole("button", { name: "Tool schreiben lassen" }));
    const error = await within(dialog).findByTestId("script-tool-error");
    expect(error).toHaveTextContent("laufen nur isoliert");
    expect(within(error).getByTestId("sandbox-setup-link")).toBeInTheDocument();
    expect(within(dialog).queryByTestId("script-tool-started")).toBeNull();
  });

  it("offers no script button for a skill without scripts", async () => {
    showPage("/skills?skill=sk_1");
    const panel = await screen.findByTestId("skill-detail");
    expect(within(panel).queryByRole("button", { name: /als Tool nutzen/ })).toBeNull();
  });
});
