// ST-068 step 5 (N-17): every problem code the API can answer with (its error catalog, copied to apiErrorCodes.json
// by scripts/api_error_codes.py and compared with the pinned nodestro-api by tests/test_api_error_codes.py) has an
// explanation of the shared help in every interface language: the help entry of its code family next to the message
// (ProblemText). The exchange codes (N-14), which the import dialogs show, also have a sentence of their own.

import { helpCoverage, helpIdForError } from "@nodestro/ui-core";
import { describe, expect, it } from "vitest";

import i18n, { LANGUAGES } from "../i18n";
import catalog from "./apiErrorCodes.json";
import { problemText } from "./errors";
import { STUDIO_HELP_DOCS, STUDIO_HELP_ERRORS, studioHelp } from "./platformHelp";

const CODES = catalog.codes;

/** Values for the documented parameters of the exchange codes (nodestro-api docs/exchange.md). */
const PARAMS = {
  name: "a.pdf",
  limit: 1_048_576,
  expected: "nodestro-mcp/1",
  found: "nodestro-connection",
  version: 2,
  supported: 1,
  refused: 1,
  first: "exchange.checksum",
  places: ["servers.0.headers.authorization"],
  problems: [{ field: "servers.0.url", reason: "missing" }],
};

describe("help coverage of the API error catalog", () => {
  it.each(LANGUAGES)("explains every code in %s", (language) => {
    const registry = studioHelp(i18n.getFixedT(language), language);
    const coverage = helpCoverage(CODES, registry);
    expect(coverage.missing).toEqual([]);
    expect(coverage.dangling).toEqual([]);
    for (const id of new Set(CODES.map((code) => helpIdForError(registry, code)))) {
      const entry = registry.entries[id!];
      expect(entry.title, `${language} ${id}`).toBeTruthy();
      expect(String(entry.summary), `${language} ${id}`).not.toMatch(/^exchange\.|\{\{/);
    }
  });

  it("maps only families the catalog has, onto entries that exist", () => {
    const registry = studioHelp(i18n.getFixedT("en"), "en");
    const unused = helpCoverage(CODES, registry).unusedMappings;
    for (const key of Object.keys(STUDIO_HELP_ERRORS)) expect(unused, key).not.toContain(key);
    for (const id of Object.values(STUDIO_HELP_ERRORS)) expect(registry.entries[id], id).toBeDefined();
    for (const id of Object.keys(STUDIO_HELP_DOCS)) expect(registry.entries[id]?.href).toMatch(/^\/docs\//);
  });

  it("has a sentence of its own for every exchange code in every language", () => {
    const exchange = CODES.filter((code) => code.startsWith("exchange."));
    expect(exchange.length).toBeGreaterThan(10);
    for (const language of LANGUAGES) {
      const t = i18n.getFixedT(language);
      for (const code of exchange) {
        for (const params of [PARAMS, {}]) {
          const text = problemText(t, { code, params });
          expect(text, `${language} ${code}`).not.toBe(t("errors.unknown"));
          if (params === PARAMS) expect(text, `${language} ${code}`).not.toMatch(/\{\{|\[object/);
        }
      }
    }
  });
});
