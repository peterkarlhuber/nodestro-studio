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

import type { ExampleCategory, ExampleCopyRequest, ExampleDetail, ExamplePattern, ExampleSummary } from "../api/types";
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
export function copyRequest(
  example: Pick<ExampleDetail, "tests" | "integrations">,
  language: string,
  tests: boolean,
  connections: Record<string, string>,
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
  };
}

export function isCategory(value: string | null): value is ExampleCategory {
  return CATEGORIES.includes(value as ExampleCategory);
}

/** The examples of a category whose name, field or description contain every word of the query. */
export function filterExamples(
  examples: ExampleSummary[],
  query: string,
  category: ExampleCategory | null,
  categoryLabel: (category: ExampleCategory) => string,
): ExampleSummary[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return examples.filter((example) => {
    if (category && example.category !== category) return false;
    if (!words.length) return true;
    const text = fold([example.name, example.field, example.description, categoryLabel(example.category)].join(" "));
    return words.every((word) => text.includes(word));
  });
}
