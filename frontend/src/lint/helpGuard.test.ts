// @vitest-environment node
// The guard against the studio's former help tooltip, Tooltip and Hint (ST-068, eslint.config.js): `npm run lint` in
// the frontend job fails when a help button is not the shared HelpTip or a tooltip not the shared Tooltip of
// @nodestro/ui-core. These cases run the real lint
// configuration on code like the old one (it must fail) and on the code the studio uses now (it must pass).
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const FRONTEND = decodeURIComponent(new URL("../..", import.meta.url).pathname).replace(/\/$/, "");
const styles = import.meta.glob<string>("../styles/*.css", { eager: true, query: "?raw", import: "default" });
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
  ])("fails on %s", async (_name, code) => {
    expect(await problems(code)).not.toEqual([]);
  });

  it("passes the shared card", async () => {
    expect(
      await problems(
        'import { ApprovalCard } from "@nodestro/ui-ai";\nexport const a = <ApprovalCard title="x" onApprove={() => {}} onReject={() => {}} />;\n',
      ),
    ).toEqual([]);
  });
});
