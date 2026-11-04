// Codes of nodestro-api PR #87: unknown ids of their kind, export jobs on a server, download codes of the portable
// export check and refused offline model packages.

import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, api } from "../api/client";
import i18n, { LANGUAGES } from "../i18n";
import { downloadCodes, problemText } from "./errors";
import { SEARCH_QUERY_CHARS, checkSearchQuery, knowledgeSearchError } from "./knowledge";

const t = i18n.getFixedT("en");

afterEach(() => vi.unstubAllGlobals());

describe("unknown ids of their kind", () => {
  it.each(["workflow", "run", "publication"])("%s.not_found names no raw id", (kind) => {
    const params = { name: "wf_1a2b3c", id: "wf_1a2b3c", kind };
    for (const language of LANGUAGES) {
      const text = problemText(i18n.getFixedT(language), { code: `${kind}.not_found`, params, message: "x" });
      expect(text).not.toContain("wf_1a2b3c");
      expect(text).not.toContain("{{");
      expect(text).not.toBe(i18n.getFixedT(language)("errors.not_found", params));
    }
    expect(problemText(t, { code: `${kind}.not_found`, params })).toMatch(/no longer exists.*Reload the page/);
  });
});

describe("portable downloads", () => {
  it("reads the codes, the older joined items and a failed job's single code", () => {
    expect(downloadCodes({ downloads: ["python", "libraries"], items: "python, libraries" })).toEqual(["python", "libraries"]);
    expect(downloadCodes({ items: "python, libraries, ollama" })).toEqual(["python", "libraries", "ollama"]);
    expect(downloadCodes({ what: "ollama" })).toEqual(["ollama"]);
    expect(downloadCodes({})).toEqual([]);
  });

  it("names the downloads in words in every language", () => {
    expect(problemText(t, { code: "export.download_needed", params: { downloads: ["python", "libraries"], items: "python, libraries" } })).toBe(
      "Building needs downloads that are not in the cache yet: Python and the libraries. Build once with an internet connection; afterwards they are in the cache.",
    );
    const de = i18n.getFixedT("de");
    expect(problemText(de, { code: "export.downloads", params: { downloads: ["python", "libraries", "ollama"] } })).toContain(
      "Python, die Bibliotheken und den Modellserver",
    );
    for (const language of LANGUAGES) {
      const text = problemText(i18n.getFixedT(language), { code: "export.download_needed", params: { downloads: ["libraries"] } });
      expect(text, language).not.toContain("libraries,");
      expect(text, language).not.toContain("{{");
    }
  });

  it("names them for an older API that sends only items", () => {
    const text = problemText(t, { code: "export.downloads", params: { items: "python, libraries", size: 1 } });
    expect(text).toBe("Building downloads Python and the libraries for the target platform once.");
  });

  it("stays general without any download (a failed build job has no params)", () => {
    expect(problemText(t, { code: "export.download_needed", params: {} })).toBe(t("errors.export.download_needed_plain"));
    expect(problemText(t, { code: "export.downloads" })).toBe(t("errors.export.downloads_plain"));
  });
});

describe("export jobs on a server", () => {
  it("explains the refusal and what to do", () => {
    expect(problemText(t, { code: "export.server_unsupported", params: {} })).toMatch(/operator.*source project/);
    expect(problemText(t, { code: "export.busy", params: {} })).toMatch(/one is built at a time/);
  });

  it("names both sizes of a refused estimate, none of a failed job", () => {
    const text = problemText(t, { code: "export.server_too_large", params: { size: 3_500_000_000, limit: 2 * 1024 ** 3 } });
    expect(text).toMatch(/about 3[.,]5\sGB.*\(2[.,]1\sGB\)/);
    expect(problemText(t, { code: "export.server_too_large", params: {} })).toBe(t("errors.export.server_too_large_plain"));
  });
});

describe("refused offline model packages", () => {
  it("names the folder and the reason when it has a sentence of its own", () => {
    expect(problemText(t, { code: "local.invalid_package", params: { reason: "invalid_package", path: "/data/import/pack" } })).toBe(
      "/data/import/pack is not an offline model package Nodestro can import. Choose the folder made with orkexa-local export; it contains orkexa-models.json.",
    );
    const damaged = problemText(t, { code: "local.invalid_package", params: { reason: "checksum_mismatch", path: "/p" } });
    expect(damaged).toContain(t("errors.local.checksum_mismatch"));
    expect(damaged).toMatch(/^\/p cannot be imported/);
    expect(problemText(t, { code: "local.invalid_package", params: {} })).toBe(t("errors.local.invalid_package"));
    for (const language of LANGUAGES) {
      const text = problemText(i18n.getFixedT(language), { code: "local.invalid_package", params: { reason: "invalid_name", path: "/p" } });
      expect(text, language).not.toContain("invalid_name");
      expect(text, language).not.toContain("{{");
    }
  });
});

describe("knowledge search bounds", () => {
  it("refuses a search text over the limit before it is sent", () => {
    expect(() => checkSearchQuery("x".repeat(SEARCH_QUERY_CHARS))).not.toThrow();
    let error: unknown;
    try {
      checkSearchQuery("x".repeat(SEARCH_QUERY_CHARS + 1));
    } catch (caught) {
      error = caught;
    }
    expect(problemText(t, { code: (error as { code: string }).code, params: (error as { params: Record<string, unknown> }).params })).toMatch(
      /at most 2[.,]000 characters/,
    );
  });

  it("keeps the hit count within 1 to 50", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        urls.push(url);
        return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
      }),
    );
    for (const k of [0, 8, 51, 1e9, undefined]) await api.searchKnowledge("offer", undefined, undefined, k);
    expect(urls.map((url) => new URL(url, "http://x").searchParams.get("k"))).toEqual(["1", "8", "50", "50", null]);
  });

  it("reads the API's 422 for q and k", () => {
    const refused = (field: string) =>
      new ApiError("x", 422, "request.invalid", { errors: [{ loc: ["query", field], msg: "too long", type: "string_too_long" }] });
    expect((knowledgeSearchError(refused("q")) as { code: string }).code).toBe("knowledge.query_too_long");
    expect((knowledgeSearchError(refused("k")) as { code: string }).code).toBe("knowledge.hits_out_of_range");
    const other = new ApiError("x", 500, "http.500", {});
    expect(knowledgeSearchError(other)).toBe(other);
  });
});
