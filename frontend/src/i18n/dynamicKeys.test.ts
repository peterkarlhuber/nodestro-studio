// @vitest-environment node
// Dynamic translation keys: t(`flow.files.formats.${format}`) and the like. The static key check in i18n.test.tsx can
// only see the fixed prefix ("flow.files.formats"), so a value without a text of its own slipped through and the
// interface showed the raw key (Word and Excel among the result file formats). This test asks the TypeScript compiler
// for the type of every ${…} part and of every key passed as a variable: when it is a closed set of literals (a union
// like ReportFormat, an `as const` list, `x ?? "default"`), every resulting key must exist as a text in all six
// languages. A part typed as plain `string` (codes from the backend, ids of examples) cannot be enumerated: such a
// call either passes a defaultValue, or is listed in OPEN with the reason why it still shows a sentence. A new open
// key is therefore a conscious decision instead of a silent gap; whatever slips through anyway is caught by the
// missing-key guard in ./index.ts (tests fail, the app shows a readable text instead of the key).

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { bundles } from "../test/locales";
import { LANGUAGES } from "./index";
import type { Messages } from "./resources";

const SRC = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const PLURAL = /_(zero|one|two|few|many|other)$/;
/** More combinations than this at one call site are not enumerated (and reported as open). */
const MAX_COMBINATIONS = 400;

/**
 * Calls whose value cannot be enumerated from its type, as "file template", with the reason the interface still
 * shows a sentence. Keep it short: prefer a literal type (`as const`, a union from api/types.ts) so the test can
 * check every value.
 */
const OPEN: Record<string, string> = {
  // Values from API responses, stored records or lists typed as string: this test cannot enumerate them. A value
  // without a text is reported by the missing-key guard in ./index.ts (component tests fail, the e2e sweep in
  // e2e/i18n.mjs fails on key-like text) and reads as words in the app, never as the dotted key.
  "assistant/MessageView.tsx assistant.handover.${target}.open": "handover targets of the assistant API",
  "assistant/MessageView.tsx assistant.handover.${target}.title": "handover targets of the assistant API",
  'automation/ModelChoicePanel.tsx automation.modelChoice.excluded.${code.replace("model.", "")}': "backend codes",
  "automation/ModelChoicePanel.tsx automation.modelChoice.skipped.${reason}": "backend codes",
  'automation/ModelChoicePanel.tsx automation.modelChoice.warnings.${code.replace("model_choice.", "")}': "backend codes",
  'components/FileInput.tsx inputs.archive.reason.${REASONS.includes(entry.reason) ? entry.reason : "other"}':
    "checked against REASONS, unknown reasons read as other",
  "editor/AgentInspector.tsx agent.iconNames.${name}": "the names of AGENT_ICONS",
  "editor/AgentInspector.tsx agent.options.${group}.${value || \"default\"}": "option lists of the agent inspector",
  "editor/ContextView.tsx context.knowledgeMode.${context.knowledge_mode}": "knowledge modes of the context preview",
  "editor/InputPreview.tsx status.${input.run_status}.label": "run status of an earlier run",
  "editor/TraceExportDialog.tsx export.kind.${kind}": "kinds counted by the trace export",
  "lib/files.ts inputs.groups.${key}": "format groups of the backend",
  "library/ExampleModels.tsx library.models.reason.${reason}": "reasons of the example model check",
  "pages/LocalModelBuild.tsx localModels.build.errors.${key}": "build problems of the backend",
  "pages/LocalModelBuild.tsx localModels.build.errors.${key}Hint": "build problems of the backend",
  "pages/LocalModelBuild.tsx localModels.build.steps.${key}": "BUILD_STEPS",
  'pages/LocalModelsHardware.tsx localModels.machine.accelerated.${status.accelerated === null ? "unknown" : String(status.accelerated)}':
    "true, false or unknown",
  "pages/RunComparePage.tsx compare.aspect.${aspect}": "aspects the run comparison names",
  "pages/SchedulesPage.tsx automation.schedule.weekdaysShort.${day}": "weekday numbers 0 to 6",
  "pages/SettingsLocalModels.tsx localModels.reasons.${reason}": "reasons of the local model catalog",
  "pages/SettingsLocalModels.tsx localModels.tasks.${task}": "tasks of the local model catalog",
  'pages/SettingsMaintenance.tsx backup.notes.${note.replace("backup.", "")}': "notes of a backup",
  "pages/SettingsMaintenance.tsx diagnostics.checks.${check.id}.${check.code}": "checks of the diagnostics API",
  "pages/SettingsMaintenance.tsx diagnostics.checks.${check.id}.title": "checks of the diagnostics API",
  "pages/SettingsNav.tsx settings.nav.groups.${group}": "SETTINGS_GROUPS",
  "pages/SettingsOutputLimits.tsx modelParams.settings.group.${group}": "operation groups of the backend",
  "pages/UsagePage.tsx usage.detail.${entry.detail}": "usage details of the backend",
  "pages/UsagePage.tsx usage.sources.${bucket.key}": "usage sources of the backend",
  "publish/ApiDocsPanel.tsx publish.docs.curl.${name}": "examples of the API docs",
  "publish/ApiDocsPanel.tsx publish.docs.purposes.${endpoint.purpose}": "endpoint purposes of the API docs",
  "publish/ApiDocsPanel.tsx publish.docs.response.${name}": "examples of the API docs",
  'publish/GateReportView.tsx publish.gate.items.${item.code.replace("gate.", "")}': "codes of the publication gate",
  "publish/RequestProblems.tsx admin.request.kind.${item.kind}": "kinds of a request problem",
  'python/DependencyDialog.tsx python.step.${(state.step ?? "deps.step.queued").replace("deps.step.", "")}':
    "steps of a dependency job",
  "python/DependencyPanel.tsx python.reason.${reason}": "reasons of a dependency check",
};

function leaves(messages: Messages, prefix = "", into = new Set<string>()): Set<string> {
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") leaves(value as Messages, path, into);
    else into.add(path.replace(PLURAL, ""));
  }
  return into;
}

const TEXTS = Object.fromEntries(LANGUAGES.map((language) => [language, leaves(bundles[language] as Messages)])) as Record<
  string,
  Set<string>
>;

interface DynamicKey {
  /** "editor/FlowInspectors.tsx:715" */
  where: string;
  /** The key expression as written: "flow.files.formats.${value}" */
  template: string;
  /** Every key the call can ask for, or null when a part is not a closed set. */
  keys: string[] | null;
  /** The call passes a defaultValue: a missing key shows that instead. */
  fallback: boolean;
}

/** The string values a type can take, or null when it is open (string, number, any …). */
function literalValues(type: ts.Type, checker: ts.TypeChecker): string[] | null {
  const parts = type.isUnion() ? type.types : [type];
  const values: string[] = [];
  for (const part of parts) {
    if (part.isStringLiteral()) values.push(part.value);
    else if (part.isNumberLiteral()) values.push(String(part.value));
    else if (part.flags & ts.TypeFlags.BooleanLiteral) values.push(checker.typeToString(part));
    else if (part.flags & ts.TypeFlags.Undefined) values.push("undefined");
    else if (part.flags & ts.TypeFlags.Null) values.push("null");
    else if (part.flags & ts.TypeFlags.Never) continue;
    else return null;
  }
  return values;
}

function templateKeys(node: ts.TemplateExpression, checker: ts.TypeChecker): string[] | null {
  let keys = [node.head.text];
  for (const span of node.templateSpans) {
    const values = literalValues(checker.getTypeAtLocation(span.expression), checker);
    if (values === null || keys.length * values.length > MAX_COMBINATIONS) return null;
    keys = keys.flatMap((key) => values.map((value) => `${key}${value}${span.literal.text}`));
  }
  return [...new Set(keys)];
}

function hasDefaultValue(options: ts.Expression | undefined): boolean {
  return Boolean(
    options &&
      ts.isObjectLiteralExpression(options) &&
      options.properties.some((property) => property.name && ts.isIdentifier(property.name) && property.name.text === "defaultValue"),
  );
}

/** t(`…${x}…`), t(key) with a literal-typed key, i18n.t(…) and <Trans i18nKey={`…`}> in every non-test source file. */
function findDynamicKeys(): DynamicKey[] {
  const config = ts.readConfigFile(`${SRC}/../tsconfig.json`, (path) => ts.sys.readFile(path));
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, `${SRC}/..`);
  const roots = parsed.fileNames.filter((file) => file.startsWith(`${SRC}/`) && !/\.test\.tsx?$/.test(file) && !file.includes("/test/"));
  const program = ts.createProgram(roots, { ...parsed.options, noEmit: true });
  const checker = program.getTypeChecker();
  const found: DynamicKey[] = [];
  const add = (source: ts.SourceFile, node: ts.Expression, keys: string[] | null, fallback: boolean) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
    const text = node.getText(source);
    found.push({
      where: `${source.fileName.slice(SRC.length + 1)}:${line + 1}`,
      template: ts.isTemplateExpression(node) ? text.slice(1, -1) : text,
      keys,
      fallback,
    });
  };
  for (const source of program.getSourceFiles()) {
    if (!roots.includes(source.fileName)) continue;
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && node.arguments.length) {
        const callee = node.expression;
        const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : "";
        const [argument, options] = node.arguments;
        if (name === "t" && ts.isTemplateExpression(argument)) add(source, argument, templateKeys(argument, checker), hasDefaultValue(options));
        else if (name === "t" && !ts.isStringLiteralLike(argument)) {
          // A key held in a variable: checked when its type is a closed set of keys ("a.b" | "a.c").
          const values = literalValues(checker.getTypeAtLocation(argument), checker);
          if (values?.length && values.every((value) => value.includes("."))) add(source, argument, values, hasDefaultValue(options));
        }
      }
      if (ts.isJsxAttribute(node) && node.name.getText(source) === "i18nKey" && node.initializer && ts.isJsxExpression(node.initializer)) {
        const expression = node.initializer.expression;
        if (expression && ts.isTemplateExpression(expression)) add(source, expression, templateKeys(expression, checker), false);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return found;
}

const sites = findDynamicKeys();

describe("dynamic translation keys", () => {
  it("are found in the source", () => {
    // A check of the scan itself: the result file formats are among the closed sets it enumerates.
    const formats = sites.find((site) => site.template === "flow.files.formats.${id}");
    expect(formats?.keys).toEqual(expect.arrayContaining(["flow.files.formats.docx", "flow.files.formats.xlsx"]));
    expect(sites.length).toBeGreaterThan(200);
  });

  it.each(LANGUAGES)("every value of a closed set has a text in %s", (language) => {
    const missing: string[] = [];
    for (const site of sites) {
      if (site.fallback) continue;
      for (const key of site.keys ?? []) if (!TEXTS[language].has(key.replace(PLURAL, ""))) missing.push(`${site.where} ${site.template} → ${key}`);
    }
    expect(missing).toEqual([]);
  });

  it("with an open value are listed with the reason they still read as a sentence", () => {
    const open = new Set(
      sites.filter((site) => site.keys === null && !site.fallback).map((site) => `${site.where.replace(/:\d+$/, "")} ${site.template}`),
    );
    expect([...open].filter((entry) => !(entry in OPEN)), "open keys not listed in OPEN").toEqual([]);
    expect(Object.keys(OPEN).filter((entry) => !open.has(entry)), "OPEN entries no longer open (remove them)").toEqual([]);
  });
});
