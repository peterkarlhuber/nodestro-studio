import { MAX_CAPABILITIES, MAX_CAPABILITY_LENGTH } from "../api/types";

/** Adds typed tags to `tags`: trimmed, without repeats (ignoring case), at most MAX_CAPABILITIES. */
export function addCapabilities(tags: string[], typed: string): string[] {
  const next = [...tags];
  for (const part of typed.split(",")) {
    const tag = part.split(/\s+/).filter(Boolean).join(" ").slice(0, MAX_CAPABILITY_LENGTH);
    if (!tag || next.some((item) => item.toLowerCase() === tag.toLowerCase())) continue;
    if (next.length >= MAX_CAPABILITIES) break;
    next.push(tag);
  }
  return next;
}
