// The skills of an agent in the inspector and the skills a step used (NAL-B3).

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Skill, SkillBinding } from "../api/skills";
import type { AgentConfig } from "../api/types";
import { defaultAgent } from "../lib/defaults";
import { usedSkills } from "./RunDetails";
import { SkillsSection, assignable, changeBinding } from "./SkillsSection";

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

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(SKILLS), { status: 200, headers: { "Content-Type": "application/json" } })),
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
