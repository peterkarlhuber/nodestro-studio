import "@xyflow/react/dist/base.css";
import "./styles/midnight-citron.css";
import "./styles/app.css";
import "./styles/tooltip.css";
import "./styles/settings.css";
import "./styles/onboarding.css";
import "./styles/admin.css";
import "./styles/assistant-files.css";
import "./styles/progress.css";
import "./styles/reasoning.css";
import "./styles/missing-model.css";
import "./styles/publications.css";
import "./styles/skills.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import i18n, { initialLanguage, loadLanguage } from "./i18n";
import { warmNumberFormats, whenIdle } from "./lib/format";
import { App } from "./App";

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  // The locale's number data loads in idle time, not in the first render of the editor (ST-004).
  whenIdle(warmNumberFormats);
  i18n.on("languageChanged", () => whenIdle(warmNumberFormats));
}

// The first render waits for the texts of the interface language, so the page never flashes English first.
// When they cannot be fetched the interface starts in English (the fallback) instead of not at all.
loadLanguage(initialLanguage()).then(render, (error: unknown) => {
  console.error("Could not load the interface language", error);
  render();
});
