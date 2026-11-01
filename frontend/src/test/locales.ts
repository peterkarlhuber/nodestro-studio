// The interface texts of every language at once, for the tests that compare languages. The app itself
// loads one language at a time (see src/i18n/index.ts loadLanguage).
import { type Areas, type Messages, collectBundles } from "../i18n/resources";

/** language → area → messages, e.g. bundles.de.common.save */
export const bundles: Record<string, Areas> = collectBundles(
  import.meta.glob<Messages>("../i18n/locales/*/*.json", { eager: true, import: "default" }),
);
