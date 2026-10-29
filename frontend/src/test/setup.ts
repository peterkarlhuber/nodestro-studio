import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

import i18n from "../i18n";

// The component tests read German labels; tests of other languages switch explicitly.
const TEST_LANGUAGE = "de";
void i18n.changeLanguage(TEST_LANGUAGE);

afterEach(async () => {
  try {
    localStorage.clear();
  } catch {
    // no storage in this environment
  }
  if (i18n.language !== TEST_LANGUAGE) await i18n.changeLanguage(TEST_LANGUAGE);
});
