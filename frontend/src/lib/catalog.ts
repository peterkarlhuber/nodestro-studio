// Interface texts for things the backend describes in English: models, server tools and the
// built-in tools. The backend's texts (and the tools' docstrings, which agents read) stay as
// they are; the interface shows a translation from catalog.* in the language files and falls
// back to the original for anything it does not know (e.g. a new model or a custom tool).

import type { TFunction } from "i18next";

import type { ModelInfo, ServerToolInfo, ToolInfo } from "../api/types";
import i18n from "../i18n";

function translated(t: TFunction, key: string, fallback: string): string {
  return i18n.exists(key) ? t(key) : fallback;
}

export function modelDescription(t: TFunction, model: ModelInfo | undefined): string | undefined {
  if (!model) return undefined;
  return translated(t, `catalog.models.${model.model.replace(/\./g, "_")}`, model.description);
}

export function serverToolLabel(t: TFunction, tool: ServerToolInfo): string {
  return translated(t, `catalog.serverTools.${tool.key}.label`, tool.label);
}

export function serverToolDescription(t: TFunction, tool: ServerToolInfo): string {
  return translated(t, `catalog.serverTools.${tool.key}.description`, tool.description);
}

/** A built-in tool's description in the interface language; other tools keep their own. */
export function toolDescription(t: TFunction, tool: Pick<ToolInfo, "name" | "kind" | "description">): string {
  if (tool.kind !== "builtin") return tool.description;
  return translated(t, `catalog.builtinTools.${tool.name}`, tool.description);
}
