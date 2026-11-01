// A tool's error output that starts with a backend code ("mcp.unreachable: Docs cannot be reached"): the code lets
// the interface say it in the current language (AD-12). Anything else is the tool's own text and stays as it is.

import i18n from "../i18n";
import type { Coded } from "./errors";

const CODED = /^([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+): ?([\s\S]*)$/;

/** The coded problem in a tool's output, or null when the output carries no code the interface knows. */
export function codedToolOutput(output: string | null | undefined): Coded | null {
  if (!output) return null;
  const match = CODED.exec(output.trim());
  if (!match) return null;
  const code = match[1];
  if (!i18n.exists(`errors.${code}`)) return null;
  // A sentence that needs values (a host, a status) cannot be filled from the text: the original stays.
  const english = i18n.getResource("en", "translation", `errors.${code}`) as unknown;
  if (typeof english !== "string" || english.includes("{{")) return null;
  return { code, params: {}, message: output.trim() };
}
