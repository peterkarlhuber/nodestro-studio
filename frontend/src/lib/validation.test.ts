import { describe, expect, it } from "vitest";

import i18n from "../i18n";
import { fieldNameProblem } from "./validation";

describe("fieldNameProblem", () => {
  it("accepts names like summary and key_metrics", () => {
    expect(fieldNameProblem("summary", ["summary", "key_metrics"])).toBeNull();
    expect(fieldNameProblem("key_metrics", ["summary", "key_metrics"])).toBeNull();
    expect(fieldNameProblem("_private", ["_private"])).toBeNull();
  });

  it("explains empty, invalid and duplicate names in the interface language", async () => {
    expect(fieldNameProblem("", [""])).toBe("agent.output.problems.empty");
    expect(i18n.t(fieldNameProblem("1st", ["1st"])!)).toMatch(/Ziffer/);
    expect(i18n.t(fieldNameProblem("summary", ["summary", "summary"])!)).toMatch(/mehrfach/);
    await i18n.changeLanguage("en");
    expect(i18n.t(fieldNameProblem("summary", ["summary", "summary"])!)).toMatch(/more than once/);
  });
});
