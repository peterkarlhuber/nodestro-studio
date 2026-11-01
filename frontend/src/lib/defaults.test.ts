import { describe, expect, it } from "vitest";

import i18n from "../i18n";
import { defaultAgent, newNode } from "./defaults";

describe("new agents", () => {
  it("start in the interface language", async () => {
    await i18n.changeLanguage("de");
    const german = defaultAgent();
    expect(german.system_prompt).toBe("Du bist ein hilfreicher Assistent.");
    expect(german.output.name).toBe("Ergebnis");
    await i18n.changeLanguage("fr");
    expect(newNode("agent").agent?.output.name).toBe("Résultat");
    await i18n.changeLanguage("en");
    expect(defaultAgent().system_prompt).toBe("You are a helpful assistant.");
    expect(defaultAgent().output.name).toBe("Result");
  });

  it("keep what the caller sets", async () => {
    await i18n.changeLanguage("es");
    expect(defaultAgent({ system_prompt: "Stored prompt" }).system_prompt).toBe("Stored prompt");
  });
});
