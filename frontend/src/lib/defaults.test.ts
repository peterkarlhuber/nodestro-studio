import { describe, expect, it } from "vitest";

import { setLanguage } from "../i18n";
import { defaultAgent, defaultEffort, getDefaultModel, newNode, setDefaultModel } from "./defaults";

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

describe("the effort of new agents (F12)", () => {
  it("is the model default on providers that refuse an effort, medium elsewhere", () => {
    expect(defaultEffort("claude-sonnet-5-5")).toBe("medium");
    expect(defaultEffort("openai:gpt-5.5")).toBe("medium");
    expect(defaultEffort("ollama:llama4")).toBeNull();
    expect(defaultEffort("vllm:qwen3")).toBeNull();
    expect(defaultEffort("compatible:my-model")).toBeNull();
    const before = getDefaultModel();
    try {
      setDefaultModel("ollama:llama4");
      expect(defaultAgent().effort).toBeNull();
      expect(defaultAgent({ model: "claude-sonnet-5-5" }).effort).toBe("medium");
    } finally {
      setDefaultModel(before);
    }
  });
});
