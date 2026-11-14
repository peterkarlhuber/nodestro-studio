// The skills of an agent in the inspector and the skills a step used (NAL-B3); groups, the limit of 100, the
// preselection hint and the skill choice of a step (NAL-B4).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Skill, SkillBinding, SkillGroup, SkillSelection } from "../api/skills";
import type { AgentConfig } from "../api/types";
import { defaultAgent } from "../lib/defaults";
import { SkillChoice, usedSkills } from "./RunDetails";
import { MAX_AGENT_SKILLS, SkillsSection, addGroup, assignable, changeBinding } from "./SkillsSection";

function skill(id: string, name: string, version: number, extra: Partial<Skill> = {}): Skill {
  return {
    id,
    name,
    description: `${name} description`,
    status: "active",
    version,
    language: "de",
    origin: "user",
    has_scripts: false,
    created_at: "2026-11-14T10:00:00Z",
    updated_at: "2026-11-14T10:00:00Z",
    ...extra,
  };
}

const SKILLS = [
  skill("skl_a", "research-method-de", 3),
  skill("skl_b", "8d-problem-solving-de", 1, { origin: `import:${"a".repeat(64)}` }),
  skill("skl_c", "old", 1, { status: "archived" }),
];

const GROUP: SkillGroup = {
  id: "grp_1",
  name: "Recherche",
  description: "Alles für Recherchen",
  skill_ids: ["skl_a", "skl_b", "skl_c", "skl_gone"],
  created_at: "2026-11-14T10:00:00Z",
  updated_at: "2026-11-14T10:00:00Z",
};

let skills: Skill[] = SKILLS;

beforeEach(() => {
  skills = SKILLS;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body = url.startsWith("/api/skill-groups") ? [GROUP] : skills;
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("pure helpers", () => {
  it("offers only active skills not assigned yet", () => {
    const bindings: SkillBinding[] = [{ skill_id: "skl_a", version: 1, mode: "on_demand" }];
    expect(assignable(SKILLS, bindings).map((item) => item.id)).toEqual(["skl_b"]);
    expect(changeBinding(bindings, "skl_a", { mode: "always" })[0]?.mode).toBe("always");
  });

  it("lists each used skill once with the files read", () => {
    const state = {
      skills: [
        { skill_id: "skl_a", name: "research-method-de", version: 2, path: null },
        { skill_id: "skl_a", name: "research-method-de", version: 2, path: "references/a.md" },
        { skill_id: "skl_a", name: "research-method-de", version: 2, path: "references/a.md" },
      ],
    };
    expect(usedSkills(state)).toEqual([{ name: "research-method-de", version: 2, files: ["references/a.md"] }]);
    expect(usedSkills({})).toEqual([]);
  });
});

describe("groups", () => {
  it("adds the active members not assigned yet, on demand in their current version, labeled with the group", () => {
    const bindings: SkillBinding[] = [{ skill_id: "skl_a", version: 1, mode: "always" }];
    expect(addGroup(SKILLS, bindings, GROUP)).toEqual([
      { skill_id: "skl_a", version: 1, mode: "always" },
      { skill_id: "skl_b", version: 1, mode: "on_demand", group_id: "grp_1" },
    ]);
  });

  it("stops at the limit of 100 skills", () => {
    const many = Array.from({ length: 105 }, (_, index) => skill(`skl_${index}`, `skill-${index}`, 1));
    const bindings = many.slice(0, 98).map((item): SkillBinding => ({ skill_id: item.id, version: 1, mode: "on_demand" }));
    const group = { ...GROUP, skill_ids: many.map((item) => item.id) };
    expect(MAX_AGENT_SKILLS).toBe(100);
    const next = addGroup(many, bindings, group);
    expect(next).toHaveLength(100);
    expect(next.slice(98).map((item) => item.skill_id)).toEqual(["skl_98", "skl_99"]);
  });
});

function showSection(agent: AgentConfig, changes: Partial<AgentConfig>[] = []) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <SkillsSection
          agent={agent}
          update={(patch) => changes.push(patch)}
          ui={{ id: "skills", open: true, onToggle: () => undefined, status: { errors: 0, warnings: 0 } }}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return changes;
}

const onDemand = (count: number): SkillBinding[] =>
  Array.from({ length: count }, (_, index) => ({ skill_id: `skl_${index}`, version: 1, mode: "on_demand" }));

describe("the skills section with groups and many skills", () => {
  it("adds a group from the select and shows the group label", async () => {
    const agent: AgentConfig = { ...defaultAgent({ name: "Rechercheur" }), skills: [{ skill_id: "skl_a", version: 3, mode: "on_demand" }] };
    const changes = showSection(agent);
    const select = await screen.findByRole("combobox", { name: "Gruppe hinzufügen" });
    expect(screen.getByRole("option", { name: "Recherche (4)" })).toBeInTheDocument();
    await userEvent.selectOptions(select, "grp_1");
    expect(changes[0]?.skills).toEqual([
      { skill_id: "skl_a", version: 3, mode: "on_demand" },
      { skill_id: "skl_b", version: 1, mode: "on_demand", group_id: "grp_1" },
    ]);
    cleanup();
    showSection({ ...agent, skills: changes[0]!.skills });
    expect(await screen.findByText("Gruppe: Recherche")).toBeInTheDocument();
    // Every member is assigned already: the group is no longer offered.
    expect(screen.queryByRole("combobox", { name: "Gruppe hinzufügen" })).toBeNull();
  });

  it("allows up to 100 skills", async () => {
    skills = Array.from({ length: 101 }, (_, index) => skill(`skl_${index}`, `skill-${index}`, 1));
    showSection({ ...defaultAgent({ name: "Viele" }), skills: onDemand(99) });
    expect(await screen.findByRole("combobox", { name: "Skill hinzufügen" })).toBeInTheDocument();
    cleanup();
    showSection({ ...defaultAgent({ name: "Viele" }), skills: onDemand(100) });
    expect(await screen.findByText("Ein Agent kann höchstens 100 Skills haben.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Skill hinzufügen" })).toBeNull();
  });

  it("explains the preselection above 20 skills loaded on demand", async () => {
    skills = Array.from({ length: 30 }, (_, index) => skill(`skl_${index}`, `skill-${index}`, 1));
    showSection({ ...defaultAgent({ name: "Zwanzig" }), skills: [...onDemand(20), { skill_id: "skl_25", version: 1, mode: "always" }] });
    await screen.findByText("skill-0");
    expect(screen.queryByTestId("skills-preselection")).toBeNull();
    cleanup();
    showSection({ ...defaultAgent({ name: "Viele" }), skills: onDemand(21) });
    expect(await screen.findByTestId("skills-preselection")).toHaveTextContent(
      "21 Skills werden bei Bedarf geladen. Jeder Schritt bietet nur die 8 am besten passenden an",
    );
  });
});

describe("the skill choice of a step", () => {
  const selection: SkillSelection = {
    method: "bm25",
    assigned: 24,
    offered: ["units", "8d-problem-solving-de", "glossary"],
    recommended: ["glossary"],
    ignored: ["web-research"],
    candidates: [
      { name: "8d-problem-solving-de", score: 1.5, chosen: true },
      { name: "units", score: 3.25, chosen: true },
      { name: "pdf-summary", score: 0.4, chosen: false },
    ],
  };

  it("shows the preselection, the recommendations and the scores", async () => {
    render(<SkillChoice selection={selection} />);
    const choice = screen.getByTestId("skill-choice");
    expect(choice).toHaveTextContent("Vorauswahl: Der Schritt bot die am besten passenden Skills an (angeboten: 3, zugewiesen: 24).");
    const offered = screen.getByRole("list", { name: "Angebotene Skills" });
    expect(offered).toHaveTextContent("glossary Empfohlen");
    expect(screen.getByTestId("skill-choice-ignored")).toHaveTextContent("Empfohlen, aber dem Agenten nicht zugewiesen: web-research");
    await userEvent.click(screen.getByText("Bewertungen der Vorauswahl (3)"));
    const rows = screen.getByTestId("skill-choice-candidates").querySelectorAll("tbody tr");
    expect([...rows].map((row) => row.textContent)).toEqual(["units3,25Ja", "8d-problem-solving-de1,5Ja", "pdf-summary0,4Nein"]);
  });

  it("names a step without preselection and shows no scores", () => {
    render(<SkillChoice selection={{ ...selection, method: "all", assigned: 3, ignored: [], candidates: [] }} />);
    expect(screen.getByTestId("skill-choice")).toHaveTextContent("Keine Vorauswahl: Der Schritt bot alle Skills des Agenten an (3).");
    expect(screen.queryByTestId("skill-choice-candidates")).toBeNull();
  });
});

describe("the skills section", () => {
  it("offers a newer version and never switches by itself", async () => {
    const changes: Partial<AgentConfig>[] = [];
    const agent: AgentConfig = {
      ...defaultAgent({ name: "Rechercheur" }),
      skills: [
        { skill_id: "skl_a", version: 2, mode: "on_demand" },
        { skill_id: "skl_b", version: 1, mode: "always" },
      ],
    };
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <SkillsSection
            agent={agent}
            update={(patch) => changes.push(patch)}
            ui={{ id: "skills", open: true, onToggle: () => undefined, status: { errors: 0, warnings: 0 } }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText("Version 3 ist verfügbar.")).toBeInTheDocument();
    expect(screen.getByText("Importiert – Inhalt prüfen")).toBeInTheDocument();
    expect(changes).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Version 3 verwenden" }));
    expect(changes[0]?.skills?.[0]).toEqual({ skill_id: "skl_a", version: 3, mode: "on_demand" });
  });
});
