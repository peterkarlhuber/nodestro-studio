// Translation quality beyond key parity: texts left in English, counted texts without plural forms, the plural
// category "many", page names that differ from the navigation, the French address form and backend codes that
// would only get a generic sentence. See docs/i18n/terminology.md for the terms behind these rules.

import { describe, expect, it } from "vitest";

import i18n, { FALLBACK_LANGUAGE, LANGUAGES, loadLanguage } from "./index";
import { bundles } from "../test/locales";
import type { Messages } from "./resources";

function flatten(messages: Messages, prefix = ""): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") for (const [inner, text] of flatten(value as Messages, path)) result.set(inner, text);
    else result.set(path, String(value));
  }
  return result;
}

const PLURAL = /_(zero|one|two|few|many|other)$/;
const texts = Object.fromEntries(LANGUAGES.map((language) => [language, flatten(bundles[language] as Messages)])) as Record<
  string,
  Map<string, string>
>;
const english = texts[FALLBACK_LANGUAGE];
const OTHERS = LANGUAGES.filter((language) => language !== FALLBACK_LANGUAGE);

describe("texts left in English", () => {
  // Words that are the same in English and the language, product and technical names. Everything else in a text
  // identical to English is a missing translation.
  const COMMON = [
    "agent", "agents", "anthropic", "api", "budget", "cache", "code", "csv", "details", "docker", "editor", "export",
    "google", "gemini", "iban", "ibans", "json", "markdown", "md", "mcp", "nodestro", "connecting",
    "intelligence", "oauth", "ollama", "orkexa", "pdf", "python", "sandbox", "sdk", "streaming", "token", "tokens", "uv",
    "version", "workflow", "workflows", "max", "ok", "orchestrator", "teams", "team", "tools", "tool", "tests", "sqlite",
    "openai", "vllm", "https", "ctrl", "esc", "amazon", "bedrock", "aws", "nova", "claude", "eu", "central",
  ];
  const ALLOWED: Record<string, string[]> = {
    de: [
      "name", "status", "start", "text", "memory", "limits", "thinking", "judge", "parallel", "review", "optional",
      "format", "standard", "port", "score", "tags", "analyst", "details", "service", "administrator",
      "assistant", // German names the button after the product, Nodestro Assistant
    ],
    es: ["error", "robot", "manual", "individual", "no"],
    fr: [
      "message", "messages", "minute", "minutes", "section", "sections", "page", "pages", "documents", "documentation",
      "description", "type", "effort", "image", "images", "structure", "validation", "sources", "suggestion", "actions",
      "action", "date", "active", "collection", "collections", "archive", "notes", "source", "strict", "note",
      "interface", "port", "module", "arguments", "service", "classification", "correction", "versions", "guide",
      "instructions", "branches", "robot", "globe", "score", "word", "citations", "format", "standard", "direct", "indirect",
      "assistant",
    ],
    it: ["file", "input", "output", "robot", "database", "provider", "runtime", "standard", "no"],
    "pt-BR": ["status", "manual", "individual", "interface", "loop", "tags"],
  };
  // Technical API names kept in English on purpose (see docs/i18n/terminology.md).
  const KEPT_KEYS = new Set(["agent.advanced.toolChoice", "agent.advanced.requestOptions", "assistant.role"]);

  it.each(OTHERS)("%s translates every text", (language) => {
    const allowed = new Set([...COMMON, ...ALLOWED[language]]);
    const untranslated: string[] = [];
    for (const [key, text] of texts[language]) {
      if (KEPT_KEYS.has(key.replace(PLURAL, ""))) continue;
      const source = english.get(key) ?? english.get(`${key.replace(PLURAL, "")}_other`);
      if (source !== text) continue;
      const words = text
        .replace(/\{\{[^}]*\}\}|<[^>]+>|Nodestro Assistant/g, " ")
        .toLowerCase()
        .match(/\p{L}+/gu);
      if (words?.some((word) => word.length > 1 && !allowed.has(word))) untranslated.push(`${key}: ${text}`);
    }
    expect(untranslated).toEqual([]);
  });
});

describe("counted texts", () => {
  // A number in front of a word: "{{count}} files", "{{warnings}} warnings".
  const COUNTED = /\{\{\s*(\w+)\s*\}\}\s+(\p{Ll}+)/gu;
  const isPluralNoun = (word: string) => word.length > 2 && word.endsWith("s") && !word.endsWith("ss");
  // Variables that are not counts, and counted words where the number is never 1 or the plural reads fine.
  const NOT_COUNTS = new Set([
    "name", "index", "tool", "node", "workflow", "model", "provider", "time", "when", "size", "free", "cost", "version", "id", "server",
    "who", "label", "path", "field", "fields", "url", "host", "type", "status", "value", "duration", "agent", "template",
    "current", "chosen", "latest", "rule", "space", "variable", "input", "iteration", "team", "teams", "max", "limit",
    "names", "tools", "nodes", "role", "tenant", "module", "packages", "previous", "number", "date", "total", "item",
  ]);
  const ALLOWED = new Set([
    "assistant.message.usage", // tokens: large numbers
    "runs.tokens",
    "diagnostics.checks.sandbox.ok", // "{{seconds}} s" is a unit
    "diagnostics.checks.connection.ok",
    "tools.services.stats.paused",
    "pricing.staleWarning", // hours: a configured interval, always more than one
    "pricing.sync.automatic",
    "errors.run.loop_exhausted", // limits from the configuration, never 1 in practice
    "errors.run.time_limit",
    "errors.run.step_limit",
    "errors.run.orchestration_limit",
    "errors.form.too_many_files", // "({{count}} given)": the count is not followed by its noun
    "pricing.staleCritical", // days: a configured threshold, always more than one
    "tools.services.stats.limits", // operator limits, always more than one
  ]);

  it("have plural forms in English", () => {
    const missing: string[] = [];
    for (const [key, text] of english) {
      if (PLURAL.test(key) || ALLOWED.has(key)) continue;
      for (const [, variable, word] of text.matchAll(COUNTED)) {
        if (variable === "count" || (isPluralNoun(word) && !NOT_COUNTS.has(variable))) {
          missing.push(`${key}: ${text}`);
          break;
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("the plural category many", () => {
  const needsMany = LANGUAGES.filter((language) => new Intl.PluralRules(language).resolvedOptions().pluralCategories.includes("many"));

  it("is needed by French, Spanish, Italian and Portuguese", () => {
    expect([...needsMany].sort()).toEqual(["es", "fr", "it", "pt-BR"]);
  });

  it.each(needsMany)("%s has a many form for every counted text", (language) => {
    const missing = [...texts[language].keys()]
      .filter((key) => key.endsWith("_other"))
      .filter((key) => !texts[language].has(key.replace(/_other$/, "_many")));
    expect(missing).toEqual([]);
  });

  it.each(needsMany)("%s shows its own text for a million", async (language) => {
    await loadLanguage(language);
    await i18n.changeLanguage(language);
    const million = i18n.t("python.install.done", { count: 1_000_000 });
    expect(million).toBe(i18n.t("python.install.done", { count: 2 }).replace("2", "1000000"));
    expect(million).not.toBe(i18n.t("python.install.done", { count: 1_000_000, lng: "en" }));
  });
});

describe("page names", () => {
  // A text that sends the user to a page names it as the navigation does.
  const PAGES = ["approvals", "batches", "tests", "schedules", "executions", "usage", "knowledge", "memory", "settings", "tools"];

  it.each(PAGES)("match the navigation label of %s in every language", (page) => {
    const label = english.get(`nav.${page}`)!;
    const quoted = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reference = new RegExp(`\\b${quoted} page\\b|\\bOpen ${quoted}\\b|\\bon the ${quoted}\\b|“${quoted}”|\\bunder ${quoted}\\b`);
    const wrong: string[] = [];
    for (const [key, text] of english) {
      if (key.startsWith("nav.") || !reference.test(text)) continue;
      for (const language of OTHERS) {
        const name = texts[language].get(`nav.${page}`)!.toLowerCase();
        if (!texts[language].get(key)?.toLowerCase().includes(name)) wrong.push(`${language} ${key}: ${texts[language].get(key)}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it("covers the Approvals page", () => {
    const label = english.get("nav.approvals")!;
    expect([...english.values()].filter((text) => text.includes(`${label} page`)).length).toBeGreaterThan(0);
  });
});

describe("address form", () => {
  // The French interface says "vous". Prompts written for a model are content, not interface text.
  const PROMPTS = new Set(["editor.defaults.systemPrompt"]);
  const INFORMAL = /(?<!\p{L})(tu|ton|ta|tes|toi|te)(?!\p{L})|(?<!\p{L})t[’'](?=\p{L})|(?<!\p{L})(réessaie|saisis-la|saisis-le|laisse vide)(?!\p{L})/iu;

  it("is vous in French", () => {
    const informal = [...texts.fr].filter(([key, text]) => !PROMPTS.has(key) && INFORMAL.test(text)).map(([key, text]) => `${key}: ${text}`);
    expect(informal).toEqual([]);
  });
});

describe("backend codes", () => {
  // Codes the runtime and the API raise that can reach the interface. Each needs its own sentence; the generic
  // sentence of its area ("The step failed.") would be wrong for them. A cross-repository check that scrapes the
  // Python code for every code is a separate task (see the UX/backend coordination notes).
  const CODES = [
    "run.already_queued", "run.not_executable", "tool.frozen", "tool.denied_by_policy", "lan.unavailable", "file.not_base64",
    "config.invalid", "access.network_needs_login", "identity.last_owner", "identity.role", "identity.subject_missing",
    "identity.tenant_exists", "identity.tenant_has_owner", "identity.tenant_id", "identity.tenant_unknown",
    // Amazon Bedrock (settings, verification, runs, pre-checks and prices).
    "provider.region_missing", "provider.region_invalid", "provider.region_not_allowed", "provider.auth_invalid",
    "provider.auth_not_allowed", "provider.profile_name_invalid", "provider.data_residency_invalid",
    "provider.data_residency_forced", "provider.data_residency_region", "provider.data_residency_violation",
    "provider.field_not_supported", "provider.bedrock_not_available", "provider.bedrock_not_configured",
    "provider.verify_not_supported", "provider.verify_rate_limited", "provider.aws_credentials_missing",
    "provider.aws_credentials_invalid", "provider.aws_access_denied", "provider.aws_profile_not_found",
    "provider.aws_region_invalid", "provider.aws_model_not_found", "provider.aws_rate_limited", "provider.aws_unreachable",
    "provider.aws_verification_failed", "check.bedrock_not_configured", "check.bedrock_not_available",
    "check.bedrock_settings_invalid", "check.model_unpriced", "pricing.region_required", "pricing.invalid_region",
    "pricing.reconciliation_not_supported", "config.reserved_request_options", "run.provider_auth_aws",
    "export.region_missing", "export.aws_profile_not_exported", "export.aws_role_not_exported", "provider.model_invalid",
  ];

  it.each(LANGUAGES)("have their own sentence in %s", (language) => {
    for (const code of CODES) expect(texts[language].has(`errors.${code}`), `${language}: errors.${code}`).toBe(true);
  });
});
