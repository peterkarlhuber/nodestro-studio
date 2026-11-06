import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

import i18n, { loadLanguage, missingKeys } from "../i18n";

// The component tests read German labels; tests of other languages switch explicitly (setLanguage, or
// loadLanguage before i18n.changeLanguage: the app fetches every language but English on demand).
const TEST_LANGUAGE = "de";
await loadLanguage(TEST_LANGUAGE);
await i18n.changeLanguage(TEST_LANGUAGE);

afterEach(async () => {
  // A text the interface asked for that exists in no language would show up as a raw key (or, in the app, as the
  // readable stand-in of src/i18n/index.ts): fail the test that rendered it.
  const missing = [...missingKeys];
  missingKeys.clear();
  if (missing.length) throw new Error(`Interface texts missing in every language: ${missing.join(", ")}`);
  try {
    localStorage.clear();
  } catch {
    // no storage in this environment
  }
  if (i18n.language !== TEST_LANGUAGE) await i18n.changeLanguage(TEST_LANGUAGE);
});
