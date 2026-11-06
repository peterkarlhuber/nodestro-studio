import { ApiError } from "../api/client";
import i18n from "../i18n";
import { LocalError } from "./errors";

// What Knowledge accepts for upload, shared by the Knowledge page and the agent's Knowledge section so both offer
// the same formats. The server checks every file again; this list only filters the file picker.
export const KNOWLEDGE_ACCEPT = ".pdf,.docx,.xlsx,.txt,.md,.markdown,.csv,.json,.html,.xml,.yaml,.yml,.png,.jpg,.jpeg,.gif,.webp";

/** Bounds of GET /api/knowledge/search (API3-10): hits per search and the length of the search text. */
export const SEARCH_MAX_HITS = 50;
export const SEARCH_QUERY_CHARS = 2000;

/**
 * The search's refusals in the interface's words: a text over the limit (checked here first, so the request is not
 * sent) and the API's 422 for q or k (an older page or another client); other errors stay as they are.
 */
export function knowledgeSearchError(error: unknown): unknown {
  if (!(error instanceof ApiError) || error.status !== 422) return error;
  const errors = Array.isArray(error.params.errors) ? (error.params.errors as { loc?: unknown }[]) : [];
  const fields = errors.flatMap((item) => (Array.isArray(item?.loc) ? [item.loc.at(-1)] : []));
  if (fields.includes("q")) return new LocalError("knowledge.query_too_long", { max: SEARCH_QUERY_CHARS.toLocaleString(i18n.language) });
  if (fields.includes("k")) return new LocalError("knowledge.hits_out_of_range", { max: SEARCH_MAX_HITS });
  return error;
}

/** Refuses a search text over the API's limit before it is sent. */
export function checkSearchQuery(query: string): void {
  if (query.length > SEARCH_QUERY_CHARS)
    throw new LocalError("knowledge.query_too_long", { max: SEARCH_QUERY_CHARS.toLocaleString(i18n.language) });
}

/** A knowledge passage an agent found with its search tool: the file (id) and its title (name, with the page of a PDF). */
export interface UsedSource {
  source: string;
  title: string;
  /** How many passages of this title the agent's searches returned. */
  passages: number;
}

// The recorded output of a knowledge search lists every hit as `[search_result 'source' 'title'] text` (Orkexa's
// describe_content, Python string reprs); other tools never write that marker at the start of a line.
const REPR = String.raw`'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"`;
const HIT = new RegExp(String.raw`^\[search_result (${REPR}) (${REPR}|None)\]`, "gm");

function unrepr(value: string): string {
  if (value === "None") return "";
  return value.slice(1, -1).replace(/\\(.)/g, (_, char: string) => (char === "n" ? " " : char === "t" ? " " : char));
}

/** The knowledge sources an agent's searches returned in a run, in the order first found. */
export function usedSources(calls: readonly { output: string | null; is_error: boolean }[]): UsedSource[] {
  const found = new Map<string, UsedSource>();
  for (const call of calls) {
    if (call.is_error || !call.output) continue;
    for (const match of call.output.matchAll(HIT)) {
      const source = unrepr(match[1]);
      const title = unrepr(match[2]) || source;
      const known = found.get(title);
      if (known) known.passages += 1;
      else found.set(title, { source, title, passages: 1 });
    }
  }
  return [...found.values()];
}
