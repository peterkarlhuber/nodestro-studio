// @vitest-environment node
// The guard against the studio's former help tooltip (ST-068, eslint.config.js): `npm run lint` in the frontend job
// fails when a help button is not the shared HelpTip of @nodestro/ui-core. These cases run the real lint
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
