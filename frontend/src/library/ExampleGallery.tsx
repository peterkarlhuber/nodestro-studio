import { ArrowRight, LayoutTemplate } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useExamples } from "../api/hooks";
import { Callout, DocLink, Spinner } from "../components/ui";
import { currentLanguage } from "../i18n";
import { ErrorText } from "../lib/errors";
import { ExampleCard } from "./ExampleCard";
import { ExamplePreview } from "./ExamplePreview";
import { CATEGORIES, CATEGORY_ICONS } from "./examples";

/** The example section of the workflow start page: featured examples and the way to all of them. */
export function ExampleGallery() {
  const { t, i18n } = useTranslation();
  const examples = useExamples(i18n.language || currentLanguage());
  const [open, setOpen] = useState<string | null>(null);
  const all = examples.data ?? [];
  const featured = all.filter((example) => example.featured);
  return (
    <section className="example-gallery" aria-labelledby="example-gallery-title" data-testid="example-gallery">
      <header className="example-gallery__head">
        <div>
          <div className="titlebar__title">
            <LayoutTemplate size={16} aria-hidden className="example-gallery__icon" />
            <h2 id="example-gallery-title">{t("library.galleryTitle")}</h2>
            <DocLink to="beispiele" label={t("common.docsFor", { title: t("library.galleryTitle") })} />
          </div>
          <p className="muted">{t("library.galleryText")}</p>
        </div>
        <Link to="/workflows/examples" className="nd-button">
          {t("library.showAll", { count: all.length || 24 })} <ArrowRight size={14} aria-hidden />
        </Link>
      </header>
      {examples.isLoading ? <Spinner /> : null}
      {examples.error ? (
        <Callout tone="danger">
          <ErrorText error={examples.error} />
        </Callout>
      ) : null}
      {all.length ? (
        <nav className="chip-row example-gallery__categories" aria-label={t("library.categories")}>
          {CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const count = all.filter((example) => example.category === category).length;
            return (
              <Link key={category} to={`/workflows/examples?category=${category}`} className="chip chip--link">
                <Icon size={11} aria-hidden /> {t(`library.category.${category}`)} <span className="muted">{count}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
      <div className="card-grid">
        {featured.map((example) => (
          <ExampleCard key={example.id} example={example} onOpen={setOpen} />
        ))}
      </div>
      {open ? <ExamplePreview key={open} id={open} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}
