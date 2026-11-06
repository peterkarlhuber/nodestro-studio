import { describe, expect, it } from "vitest";

import { codeSuffix } from "./codes";

describe("codeSuffix", () => {
  it("drops the prefix of a code", () => {
    expect(codeSuffix("model.", "model.pass_rate_low")).toBe("pass_rate_low");
    expect(codeSuffix("backup.", "backup.other_version")).toBe("other_version");
  });

  it("keeps a union of codes a union of their suffixes", () => {
    const code = "model.unavailable" as "model.unavailable" | "model.cost_unknown";
    const suffix: "unavailable" | "cost_unknown" = codeSuffix("model.", code);
    expect(suffix).toBe("unavailable");
  });

  it("keeps a code without the prefix", () => {
    expect(codeSuffix("gate.", "tested")).toBe("tested");
  });
});
