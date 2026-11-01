import "@xyflow/react/dist/base.css";
import "./styles/midnight-citron.css";
import "./styles/app.css";
import "./styles/onboarding.css";
import "./styles/admin.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { initialLanguage, loadLanguage } from "./i18n";
import { App } from "./App";

function render() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// The first render waits for the texts of the interface language, so the page never flashes English first.
// When they cannot be fetched the interface starts in English (the fallback) instead of not at all.
loadLanguage(initialLanguage()).then(render, (error: unknown) => {
  console.error("Could not load the interface language", error);
  render();
});
