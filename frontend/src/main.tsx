import "@xyflow/react/dist/base.css";
// The shared UI packages (N-16): neutral tokens, the studio's brand theme, then the component styles. Before the
// studio's own sheets, so these keep the last word wherever both set the same thing (color-scheme).
import "@nodestro/ui-tokens/tokens.css";
import "@nodestro/ui-themes/nodestro.css";
import "@nodestro/ui-core/styles.css";
import "@nodestro/ui-ai/styles.css";
import "./styles/midnight-citron.css";
import "./styles/app.css";
import "./styles/tooltip.css";
import "./styles/settings.css";
import "./styles/onboarding.css";
import "./styles/admin.css";
import "./styles/assistant-files.css";
import "./styles/progress.css";
import "./styles/reasoning.css";
import "./styles/conversations.css";
import "./styles/missing-model.css";
import "./styles/publications.css";
import "./styles/skills.css";
import "./styles/recovery.css";
import "./styles/notifications.css";
import "./styles/drafts.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import i18n, { initialLanguage, loadLanguage } from "./i18n";
import { warmNumberFormats, whenIdle } from "./lib/format";
import { App } from "./App";
import { SessionGate } from "./components/SignedOut";
import { startMode } from "./recovery/api";
import { RecoveryScreen } from "./recovery/RecoveryScreen";

// The backend in recovery mode (TABRION MIG-NOD-9) offers only the repair of the database's permissions: the
// interface shows that dialog and nothing else.
const mode = startMode();

async function render() {
  const recovery = (await mode) === "recovery";
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {recovery ? (
        <RecoveryScreen />
      ) : (
        <SessionGate>
          <App />
        </SessionGate>
      )}
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
  void render();
});
