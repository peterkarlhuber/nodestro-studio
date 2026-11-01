import { describe, expect, it } from "vitest";

import { setLanguage } from "../i18n";
import { defaultAgent, newNode } from "./defaults";

describe("new agents", () => {
  it("start in the interface language", async () => {
    await setLanguage("de", false);
    const german = defaultAgent();
    expect(german.system_prompt).toBe("Du bist ein hilfreicher Assistent.");
    expect(german.output.name).toBe("Ergebnis");
    await setLanguage("fr", false);
    expect(newNode("agent").agent?.output.name).toBe("Résultat");
    await setLanguage("en", false);
    expect(defaultAgent().system_prompt).toBe("You are a helpful assistant.");
    expect(defaultAgent().output.name).toBe("Result");
  });

  it("keep what the caller sets", async () => {
    await setLanguage("es", false);
    expect(defaultAgent({ system_prompt: "Stored prompt" }).system_prompt).toBe("Stored prompt");
  });
});
