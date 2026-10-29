// Shared bits of the example gallery: category symbols and the client-side filter.
//
// The examples come from the backend (/api/library) in the interface language. Listing and
// previewing them stores nothing and never calls a model; only "copy" creates a workflow.

import { Briefcase, Factory, GraduationCap, House, Landmark, type LucideIcon, Megaphone } from "lucide-react";

import type { ExampleCategory, ExampleSummary } from "../api/types";
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
