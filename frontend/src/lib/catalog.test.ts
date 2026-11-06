// Catalog texts in the interface language: local model names and descriptions (ST-050).

import { describe, expect, it } from "vitest";

import { modelName } from "../components/ModelPicker";
import i18n, { loadLanguage } from "../i18n";
import type { ModelInfo } from "../api/types";
import { modelDescription, modelLabel } from "./catalog";

const t = i18n.t.bind(i18n);

function local(model: string, label: string): ModelInfo {
  return {
    id: `ollama:${model}`,
    provider: "ollama",
    model,
    label,
    tier: "Local",
    description: "Small and fast: classifying, extracting, short texts; tool use works with limits",
    recommended: true,
    price_status: "local",
  } as ModelInfo;
}

const cloud = { id: "anthropic:claude-sonnet-5-5", label: "Claude Sonnet 5.5", price_status: "current" as const };

describe("local model names", () => {
  it("replaces the runtime's English marker with the interface language's (German in the tests)", () => {
    expect(modelLabel(local("qwen3.5:4b", "Qwen3.5 4B (local)"))).toBe("Qwen3.5 4B (lokal)");
  });

  it("adds the marker when a newer runtime sends the plain name", () => {
    expect(modelLabel(local("qwen3.5:4b", "Qwen3.5 4B"))).toBe("Qwen3.5 4B (lokal)");
  });

  it("keeps product names of other models unchanged", () => {
    expect(modelLabel(cloud)).toBe("Claude Sonnet 5.5");
    expect(modelLabel({ label: "My endpoint (local)" })).toBe("My endpoint (local)");
  });

  it("follows the interface language", async () => {
    await loadLanguage("it");
    await i18n.changeLanguage("it");
    expect(modelLabel(local("qwen3.5:9b", "Qwen3.5 9B (local)"))).toBe("Qwen3.5 9B (locale)");
    await i18n.changeLanguage("en");
    expect(modelLabel(local("qwen3.5:9b", "Qwen3.5 9B (local)"))).toBe("Qwen3.5 9B (local)");
  });

  it("is what modelName shows for a catalog model, and an unknown id stays as it is", () => {
    const models = [local("qwen3.5:4b", "Qwen3.5 4B (local)"), cloud];
    expect(modelName(models, "ollama:qwen3.5:4b")).toBe("Qwen3.5 4B (lokal)");
    expect(modelName(models, "anthropic:claude-sonnet-5-5")).toBe("Claude Sonnet 5.5");
    expect(modelName(models, "ollama:llama9:1b")).toBe("ollama:llama9:1b");
  });
});

describe("local model descriptions", () => {
  it("are translated although the model id contains a colon", () => {
    expect(modelDescription(t, local("qwen3.5:4b", "Qwen3.5 4B (local)"))).toBe(
      "Klein und schnell: Klassifizieren, Extrahieren, kurze Texte; Tools nur eingeschränkt",
    );
  });

  it("fall back to the runtime's text for a model the interface does not know", () => {
    const unknown = { ...local("gemma9:2b", "Gemma 9 2B"), description: "A new model" };
    expect(modelDescription(t, unknown)).toBe("A new model");
  });
});
