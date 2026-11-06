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
  // Colons (local models such as "qwen3.5:4b") would read as an i18next namespace separator.
  return translated(t, `catalog.models.${model.model.replace(/[.:]/g, "_")}`, model.description);
}

/** The English marker older runtimes append to local catalog labels ("Qwen3.5 4B (local)"). */
const LOCAL_SUFFIX = /\s*\(local\)\s*$/i;

/**
 * The display name of a catalog model in the interface language. A local model (``price_status === "local"``) gets
 * the localized marker ("Qwen3.5 4B (lokal)"); the runtime's own English "(local)" suffix is dropped first, so the
 * name reads the same with older and newer runtimes. Every other model keeps its label (product names).
 */
export function modelLabel(model: Pick<ModelInfo, "label" | "price_status">): string {
  if (model.price_status !== "local") return model.label;
  const name = model.label.replace(LOCAL_SUFFIX, "").trim() || model.label;
  return i18n.t("models.localName", { name });
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
