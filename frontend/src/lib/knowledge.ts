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
