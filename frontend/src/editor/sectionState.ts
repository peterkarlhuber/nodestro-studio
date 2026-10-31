// Which sections of the agent form are open. Like the editor layout (layout.ts) this is a preference of the
// browser, not part of the agent: it is kept in localStorage, never marks a workflow as changed, never enters the
// undo history and never appears in an export. It is remembered per section, not per agent, so a section opened
// on one agent stays open on the next one and after a reload.
//
// A section the user has never toggled has no entry and keeps its own default (for example: Tools open when the
// agent has tools). Stored values are checked on load, so an old or edited entry falls back to the defaults.

import { create } from "zustand";

import type { AgentSectionId } from "./agentSummaries";

export const AGENT_SECTIONS: readonly AgentSectionId[] = [
  "tools",
  "knowledge",
  "memory",
  "output",
  "thinking",
  "quality",
  "advanced",
];

const STORAGE = "nodestro-agent-sections";

export type OpenSections = Partial<Record<AgentSectionId, boolean>>;

export interface AgentSectionState {
  open: OpenSections;
  setOpen: (section: AgentSectionId, open: boolean) => void;
}

/** Reads stored sections; unknown sections and values that are not booleans are dropped. */
export function parseSections(raw: string | null): OpenSections {
  if (!raw) return {};
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const stored = value as Record<string, unknown>;
  const open: OpenSections = {};
  for (const section of AGENT_SECTIONS) {
    if (typeof stored[section] === "boolean") open[section] = stored[section] as boolean;
  }
  return open;
}

function load(): OpenSections {
  try {
    return parseSections(localStorage.getItem(STORAGE));
  } catch {
    return {};
  }
}

function save(open: OpenSections): void {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(open));
  } catch {
    // storage may be unavailable (private mode); the sections are then remembered until the next reload
  }
}

export const useAgentSections = create<AgentSectionState>((set, get) => ({
  open: load(),
  setOpen: (section, open) => {
    if (get().open[section] === open) return;
    const next = { ...get().open, [section]: open };
    set({ open: next });
    save(next);
  },
}));
