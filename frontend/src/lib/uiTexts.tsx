// The studio's own wording in the shared components of @nodestro/ui-*: a component inside <StudioTexts texts={…}>
// answers the listed package keys with the studio's texts (in the interface language); every other key keeps the
// package text. The maps are constants next to the component that uses them.

import { type Translate, UiTextProvider } from "@nodestro/ui-core";
import { type ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Package key -> the studio's key. */
export type StudioTextMap = Readonly<Record<string, string>>;

export function StudioTexts({ texts, children }: { texts: StudioTextMap; children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const translate = useCallback<Translate>((key, values) => (key in texts ? t(texts[key], values) : undefined), [t, texts]);
  return (
    <UiTextProvider locale={i18n.language} translate={translate}>
      {children}
    </UiTextProvider>
  );
}
