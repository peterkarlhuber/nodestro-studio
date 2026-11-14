// Shared bits of the example gallery: category symbols and the client-side filter.
//
// The examples come from the backend (/api/library) in the interface language. Listing and
// previewing them stores nothing and never calls a model; only "copy" creates a workflow.

import {
  Briefcase,
  Factory,
  GitBranch,
  GitFork,
  GraduationCap,
  House,
  Landmark,
  type LucideIcon,
  Megaphone,
  Network,
  Workflow,
} from "lucide-react";

import type {
  ExampleCategory,
  ExampleCopyRequest,
  ExampleDetail,
  ExampleLevel,
  ExamplePattern,
  ExampleSummary,
} from "../api/types";
import { fold } from "../docs/search";

export const CATEGORIES: ExampleCategory[] = ["industry", "business", "customers", "knowledge", "administration", "private"];

export const CATEGORY_ICONS: Record<ExampleCategory, LucideIcon> = {
  industry: Factory,
  business: Briefcase,
  customers: Megaphone,
  knowledge: GraduationCap,
  administration: Landmark,
  private: House,
};

export const PATTERN_ICONS: Record<ExamplePattern, LucideIcon> = {
  sequential: Workflow,
  parallel: GitFork,
  branching: GitBranch,
  adaptive: Network,
};

/** The value of a connection choice that keeps an integration in its offline mode (sample data). */
export const OFFLINE = "";

/**
 * The body of "copy to my workflows". ``connections`` maps integration ids to the chosen MCP server
 * (``OFFLINE`` for none); only real choices are sent, and a connected copy never asks for the test series
 * (test series run without a person, and MCP tools are refused there; the backend refuses the combination).
 */
/** The runtime's rule for memory space names (nodestro_runtime.memory_spaces.SPACE_PATTERN). */
export const MEMORY_SPACE_NAME = /^[A-Za-z0-9][A-Za-z0-9 _.-]{0,63}$/;

/** Whether an agent of the example (or of one of its teams) keeps persistent memory. */
export function usesMemory(example: Pick<ExampleDetail, "features" | "agent_details">): boolean {
  return example.features.includes("memory") || example.agent_details.some((agent) => agent.memory);
}

/**
 * A memory space name made from the copy's name (EX-007): accents dropped, other characters the rule does not allow
 * turned into spaces, at most 64 characters. Empty when nothing usable is left.
 */
export function memorySpaceSuggestion(name: string): string {
  const plain = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
  const cleaned = plain
    .replace(/[^A-Za-z0-9 _.-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z0-9]+/, "")
    .trim();
  return cleaned.slice(0, 64).trim();
}

/** Whether ``value`` may be sent as the copy's memory space: empty (the example's shared space) or a valid name. */
export function validMemorySpace(value: string): boolean {
  const name = value.trim();
  return name === "" || MEMORY_SPACE_NAME.test(name);
}

export function copyRequest(
  example: Pick<ExampleDetail, "tests" | "integrations" | "services">,
  language: string,
  tests: boolean,
  connections: Record<string, string>,
  /** Agent key -> model the person chose in the dialog (only choices that differ from the suggestion). */
  models: Record<string, string> = {},
  /** The copy's own memory space (EX-007); empty: the example's space, shared by every copy. */
  memorySpace = "",
  /** Kind -> service connection chosen in the dialog (NAL-B2); kinds without a choice stay open. */
  services: Record<string, string> = {},
): ExampleCopyRequest {
  const known = new Set(example.integrations.map((integration) => integration.id));
  const integrations = Object.fromEntries(
    Object.entries(connections).filter(([id, server]) => known.has(id) && server !== OFFLINE),
  );
  const connected = Object.keys(integrations).length > 0;
  return {
    language,
    tests: tests && !connected && example.tests.length > 0,
    ...(connected ? { integrations } : {}),
    ...(Object.keys(models).length ? { models } : {}),
    ...(memorySpace.trim() ? { memory_space: memorySpace.trim() } : {}),
    ...(chosenServices(example.services ?? [], services)),
  };
}

/** The chosen service connections the example needs, as the copy request takes them (nothing when none). */
function chosenServices(needed: string[], chosen: Record<string, string>): Pick<ExampleCopyRequest, "services"> {
  const services = Object.fromEntries(needed.filter((kind) => chosen[kind]).map((kind) => [kind, chosen[kind]!]));
  return Object.keys(services).length ? { services } : {};
}

export function isCategory(value: string | null): value is ExampleCategory {
  return CATEGORIES.includes(value as ExampleCategory);
}

export const LEVELS: ExampleLevel[] = ["beginner", "advanced"];

export function isLevel(value: string | null): value is ExampleLevel {
  return LEVELS.includes(value as ExampleLevel);
}

/** What a search can match besides the example's own texts, in the interface language (labels of its badges). */
export interface ExampleLabels {
  category: (category: ExampleCategory) => string;
  level: (level: ExampleLevel) => string;
  pattern: (pattern: ExamplePattern) => string;
  feature: (feature: ExampleSummary["features"][number]) => string;
}

/** Words people search for that name a building block without being its label (MCP for a connection). */
const FEATURE_KEYWORDS: Partial<Record<ExampleSummary["features"][number], string>> = {
  integration: "MCP",
};

/**
 * The examples of a category (and level) where every word of the query appears in the name, field, description,
 * category, level, pattern, building blocks or tools, so "approval", "knowledge" or "beginner" find what the badges
 * show (in the interface language).
 */
export function filterExamples(
  examples: ExampleSummary[],
  query: string,
  category: ExampleCategory | null,
  labels: ExampleLabels,
  level: ExampleLevel | null = null,
): ExampleSummary[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return examples.filter((example) => {
    if (category && example.category !== category) return false;
    if (level && example.level !== level) return false;
    if (!words.length) return true;
    const text = fold(
      [
        example.name,
        example.field,
        example.description,
        labels.category(example.category),
        labels.level(example.level),
        labels.pattern(example.pattern),
        ...example.features.flatMap((feature) => [labels.feature(feature), FEATURE_KEYWORDS[feature] ?? ""]),
        ...example.tools,
      ].join(" "),
    );
    return words.every((word) => text.includes(word));
  });
}

/**
 * How much an example asks of a first-time user: beginner before advanced, then a straight sequence before
 * branches and teams, then no input files, then fewer building blocks. Lower is easier.
 */
export function difficulty(example: ExampleSummary): number[] {
  return [
    LEVELS.indexOf(example.level),
    example.pattern === "sequential" ? 0 : example.pattern === "adaptive" ? 2 : 1,
    example.features.includes("documents") ? 1 : 0,
    example.features.length,
  ];
}

function compare(a: number[], b: number[]): number {
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

/** Easiest first; equally easy examples keep the library's order. */
export function easiestFirst<T extends ExampleSummary>(examples: T[]): T[] {
  return [...examples].sort((a, b) => compare(difficulty(a), difficulty(b)) || a.number - b.number);
}

/** Beginner examples first (the library's order within each level): the order of the full gallery. */
export function byLevel<T extends ExampleSummary>(examples: T[]): T[] {
  return [...examples].sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.number - b.number);
}

/** The list with the "Start here" example moved to the front, so the gallery begins with it (F9). */
export function startHereFirst<T extends ExampleSummary>(examples: T[], first: string | null): T[] {
  const index = first ? examples.findIndex((item) => item.id === first) : -1;
  return index > 0 ? [examples[index], ...examples.slice(0, index), ...examples.slice(index + 1)] : examples;
}

/** The example a newcomer should try first ("Start here"): the easiest one. */
export function startHere(examples: ExampleSummary[]): string | null {
  return easiestFirst(examples)[0]?.id ?? null;
}
