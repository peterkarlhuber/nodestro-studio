// @vitest-environment node
// The guard against the studio's former help tooltip, Tooltip and Hint (ST-068, eslint.config.js): `npm run lint` in
// the frontend job fails when a help button is not the shared HelpTip or a tooltip not the shared Tooltip of
// @nodestro/ui-core. These cases run the real lint
// configuration on code like the old one (it must fail) and on the code the studio uses now (it must pass).
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const FRONTEND = decodeURIComponent(new URL("../..", import.meta.url).pathname).replace(/\/$/, "");
// Read from disk: with `css: false` (vite.config.ts) vitest hands stylesheets over empty, also with `?raw`, which
// would let every stylesheet check pass. The frontend has no Node types, so the module is typed here.
type Fs = { readdirSync(path: string): string[]; readFileSync(path: string, encoding: "utf-8"): string };
const { readdirSync, readFileSync } = (globalThis as unknown as { process: { getBuiltinModule(id: string): Fs } }).process.getBuiltinModule("node:fs");
const STYLES = `${FRONTEND}/src/styles`;
const styles = Object.fromEntries(
  readdirSync(STYLES)
    .filter((name) => name.endsWith(".css"))
    .map((name) => [name, readFileSync(`${STYLES}/${name}`, "utf-8")]),
);
const eslint = new ESLint({ cwd: FRONTEND });

async function problems(code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: `${FRONTEND}/src/pages/Example.tsx` });
  return result.messages.filter((message) => message.ruleId === "no-restricted-syntax").map((message) => message.message);
}

describe("the help guard", () => {
  it.each([
    ["the old import from the studio's components", 'import { HelpTip } from "../components/Tooltip";\nexport const a = <HelpTip id="agent.model" />;\n'],
    ["a HelpTip re-exported by the studio's ui module", 'import { HelpTip } from "../components/ui";\nexport const a = <HelpTip id="agent.model" />;\n'],
    ["a re-export of the shared one", 'import { HelpTip } from "@nodestro/ui-core";\nexport { HelpTip };\n'],
    ["a help tooltip of its own", "export function HelpTip() {\n  return null;\n}\n"],
    ["a help tooltip of its own (arrow function)", "export const HelpTip = () => null;\n"],
    ["the old class name", 'export const a = <button type="button" className="help-tip">?</button>;\n'],
    ["the old class name in a template", "const open = true;\nexport const a = <button type=\"button\" className={`help-tip ${open ? \"help-tip--open\" : \"\"}`}>?</button>;\n"],
  ])("fails on %s", async (_name, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it("passes the shared HelpTip and other class names", async () => {
    expect(
      await problems(
        'import { HelpTip } from "@nodestro/ui-core";\nexport const a = (\n  <span className="section__tip help-tipsy">\n    <HelpTip id="agent.model" topic="Model" />\n  </span>\n);\n',
      ),
    ).toEqual([]);
  });

  it("finds no style for the old class in the stylesheets", () => {
    expect(Object.keys(styles).length).toBeGreaterThan(5);
    expect(styles["app.css"]).toMatch(/\.ui-tooltip/);
    for (const [file, text] of Object.entries(styles)) expect(text, file).not.toMatch(/\.help-tip\b/);
  });
});

describe("the tooltip guard", () => {
  it.each([
    ["the old import from the studio's components", 'import { Tooltip } from "../components/Tooltip";\nexport const a = <Tooltip content="x"><button type="button">a</button></Tooltip>;\n'],
    ["a Tooltip re-exported by the studio's ui module", 'import { Tooltip } from "../components/ui";\nexport const a = <Tooltip content="x"><button type="button">a</button></Tooltip>;\n'],
    ["the old Hint", 'import { Hint } from "../components/ui";\nexport const a = <Hint id="workflow.save"><button type="button">a</button></Hint>;\n'],
    ["the old module, whatever it exports", 'import { placeTip } from "../components/Tooltip";\nexport const a = placeTip;\n'],
    ["a re-export of the shared one", 'import { Tooltip } from "@nodestro/ui-core";\nexport { Tooltip };\n'],
    ["a tooltip of its own", "export function Tooltip() {\n  return null;\n}\n"],
    ["a Hint of its own (arrow function)", "export const Hint = () => null;\n"],
    ["the old class name", 'export const a = <div role="tooltip" className="tooltip">x</div>;\n'],
    ["the old class name in a template", "const below = true;\nexport const a = <div role=\"tooltip\" className={`tooltip ${below ? \"tooltip--below\" : \"\"}`}>x</div>;\n"],
  ])("fails on %s", async (_name, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it("passes the shared Tooltip, also with a help id, and other class names", async () => {
    expect(
      await problems(
        'import { Tooltip } from "@nodestro/ui-core";\nexport const a = (\n  <span className="has-tip tooltip-row">\n    <Tooltip content="x"><button type="button">a</button></Tooltip>\n    <Tooltip help="workflow.save"><button type="button">b</button></Tooltip>\n  </span>\n);\n',
      ),
    ).toEqual([]);
  });

  it("finds no style for the old tooltip in the stylesheets", () => {
    for (const [file, text] of Object.entries(styles)) expect(text, file).not.toMatch(/(^|[^-\w])\.tooltip\b/m);
  });
});

describe("the approval card guard", () => {
  it.each([
    ["a card of its own", "export function ApprovalCard() {\n  return null;\n}\n"],
    ["remember options of its own", "export const RememberOptions = () => null;\n"],
    ["the studio's former remember fields", "function RememberDecision() {\n  return null;\n}\nexport const a = RememberDecision;\n"],
    ["the shared card from elsewhere", 'import { ApprovalCard } from "../runs/cards";\nexport const a = ApprovalCard;\n'],
    ["a re-export of the shared card", 'import { ApprovalCard } from "@nodestro/ui-ai";\nexport { ApprovalCard };\n'],
    ["the former card frame", 'export const a = <article className="approval-card" />;\n'],
    ["the former budget card", 'export const a = <article className="approval-card budget-card" />;\n'],
    ["the former card's actions in a template", "export const a = (x: string) => <div className={`row-gap approval-card__actions ${x}`} />;\n"],
    ["the former card's head", 'export const a = <header className="approval-card__head" />;\n'],
  ])("fails on %s", async (_name, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it("passes the shared card and the studio's own parts inside it", async () => {
    expect(
      await problems(
        'import { ApprovalCard } from "@nodestro/ui-ai";\nexport const a = (\n  <ApprovalCard title="x" onApprove={() => {}} onReject={() => {}}>\n    <div className="approval-card__note approval-note" />\n  </ApprovalCard>\n);\n',
      ),
    ).toEqual([]);
  });

  it("finds no style for the former card frame in the stylesheets", () => {
    for (const [file, text] of Object.entries(styles)) expect(text, file).not.toMatch(/\.(approval-card|budget-card)(\s|\{|,|\.|__head|__actions)/);
  });
});

describe("the chat guard (ST-068 step 4)", () => {
  it.each([
    ["an answer column of its own", 'export const a = <div className="chat-answer" />;\n'],
    ["a tool call body of its own", "export const a = (x: string) => <div className={`tool-calls__body ${x}`} />;\n"],
    ["a source item of its own", 'export const a = <li className="web-sources__item" />;\n'],
    ["a tool call row of its own", "export function ToolCall() {\n  return null;\n}\n"],
    ["a source list of its own", "export const SourceList = () => null;\n"],
    ["the shared row from elsewhere", 'import { ToolCallRow } from "../runs/rows";\nexport const a = ToolCallRow;\n'],
  ])("fails on %s", async (_name, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it("passes the shared components and the studio's own message type", async () => {
    expect(
      await problems(
        'import { ChatMessage, SourceList, ToolCallRow } from "@nodestro/ui-ai";\nimport type { ChatMessage as Stored } from "../api/types";\nexport const a = (m: Stored) => (\n  <ChatMessage role="assistant" className="chat-message">\n    {m.content}\n    <ToolCallRow name="x" status="running" disclosure />\n    <SourceList sources={[]} className="web-sources" />\n  </ChatMessage>\n);\n',
      ),
    ).toEqual([]);
  });

  it("finds no style for the former answer column, tool call body or source items", () => {
    for (const [file, text] of Object.entries(styles)) expect(text, file).not.toMatch(/\.(chat-answer|tool-calls__body|web-sources__item|web-sources__text)\b/);
  });
});

describe("the button guard (ST-068 step 6)", () => {
  it.each([
    ["a button of its own", "export const Button = () => null;\n"],
    ["an icon button of its own", "export function IconButton() {\n  return null;\n}\n"],
    ["a two-step button of its own", "export function ConfirmIconButton() {\n  return null;\n}\n"],
    ["the shared button from elsewhere", 'import { Button } from "../components/ui";\nexport const a = <Button>Save</Button>;\n'],
    ["a re-export of its own", 'import { Button } from "@nodestro/ui-core";\nexport { Button };\n'],
    ["the former button class", 'export const a = <a className="nd-button nd-button--sm" href="/x">Open</a>;\n'],
    ["the former icon button class", "export const a = (x: string) => <a className={`icon-button ${x}`} href=\"/x\" aria-label=\"Open\" />;\n"],
  ])("fails on %s", async (_name, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it("passes the shared buttons, their classes on a link and other classes", async () => {
    expect(
      await problems(
        'import { Button, ConfirmIconButton, IconButton } from "@nodestro/ui-core";\nimport { Plus, Trash2 } from "lucide-react";\nexport const a = (\n  <>\n    <Button icon={<Plus size={15} />}>Add</Button>\n    <IconButton icon={<Plus size={16} />} label="Add" />\n    <ConfirmIconButton icon={<Trash2 size={16} />} label="Delete" onConfirm={() => undefined} />\n    <a className="ui-button ui-button--sm" href="/x">Open</a>\n    <button className="wl-icon-button" aria-label="Menu" />\n  </>\n);\n',
      ),
    ).toEqual([]);
  });

  it("finds no style for the former button classes in the stylesheets", () => {
    const welcome = readFileSync(`${FRONTEND}/src/welcome/welcome.css`, "utf-8");
    for (const [file, text] of Object.entries({ ...styles, "welcome.css": welcome })) expect(text, file).not.toMatch(/(^|[^\w-])\.(nd-button|icon-button)\b/m);
    expect(styles["app.css"]).toMatch(/\.ui-icon-button \{/);
  });
});
