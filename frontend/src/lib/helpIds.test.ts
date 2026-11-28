// The help ids the source names: every one is an entry of the studio's help registry (lib/platformHelp.tsx). The
// shared HelpTip renders nothing for an unknown id, so a typo would silently drop a help button (ST-068).
import { platformHelp } from "@nodestro/ui-help";
import { describe, expect, it } from "vitest";

import { HELP_IDS } from "./help";
import { STUDIO_HELP_DOCS } from "./platformHelp";

const sources = import.meta.glob<string>(["../**/*.{ts,tsx}", "!../**/*.test.{ts,tsx}"], { eager: true, query: "?raw", import: "default" });
const known = new Set<string>([...HELP_IDS, ...Object.keys(STUDIO_HELP_DOCS), ...Object.keys(platformHelp("en").entries)]);

/** The string literals of every <HelpTip …/> tag and of every `tip="…"` prop, per file. */
function usedIds(): Array<[string, string]> {
  const used: Array<[string, string]> = [];
  for (const [file, text] of Object.entries(sources)) {
    for (const [tag] of text.matchAll(/<(?:PlatformHelpTip|HelpTip)\b[\s\S]*?\/>/g)) {
      const id = /\bid=(?:"([^"]+)"|\{([^}]+)\})/.exec(tag);
      if (!id) continue;
      for (const [, literal] of (id[1] ? `"${id[1]}"` : id[2]).matchAll(/"([^"]+)"/g)) used.push([file, literal]);
    }
    for (const [, literal] of text.matchAll(/\btip="([^"]+)"/g)) used.push([file, literal]);
  }
  return used;
}

describe("help ids in the source", () => {
  it("are all registered", () => {
    const used = usedIds();
    expect(used.length).toBeGreaterThan(150);
    expect(used.filter(([, id]) => !known.has(id)).map(([file, id]) => `${file}: ${id}`)).toEqual([]);
  });
});
