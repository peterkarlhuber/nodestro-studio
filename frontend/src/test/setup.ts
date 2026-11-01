import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

import i18n, { loadLanguage } from "../i18n";

// The component tests read German labels; tests of other languages switch explicitly (setLanguage, or
// loadLanguage before i18n.changeLanguage: the app fetches every language but English on demand).
const TEST_LANGUAGE = "de";
await loadLanguage(TEST_LANGUAGE);
await i18n.changeLanguage(TEST_LANGUAGE);

afterEach(async () => {
  try {
    localStorage.clear();
  } catch {
    // no storage in this environment
  }
  if (i18n.language !== TEST_LANGUAGE) await i18n.changeLanguage(TEST_LANGUAGE);
});
