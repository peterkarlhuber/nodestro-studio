import { ArrowRight, LayoutTemplate } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useExamples } from "../api/hooks";
import { Callout, DocLink, Section, Spinner } from "../components/ui";
import { currentLanguage } from "../i18n";
import { ErrorText } from "../lib/errors";
import { ExampleCard } from "./ExampleCard";
import { ExamplePreview } from "./ExamplePreview";
import { CATEGORIES, CATEGORY_ICONS, easiestFirst, startHere } from "./examples";
import { usePreviewParam } from "./previewParam";

const OPEN_KEY = "nodestro.gallery.open";

function storedOpen(): boolean {
  try {
    return window.localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

function storeOpen(open: boolean) {
  try {
    window.localStorage.setItem(OPEN_KEY, open ? "1" : "0");
  } catch {
    // Without storage the gallery simply starts closed again next time.
  }
}

/**
 * The example section of the workflow start page: featured examples, easiest first with a "Start here" mark, and the
 * way to all of them. ``collapsible`` (for people who already have workflows) folds it into a closed section that
 * remembers being opened; the compact start row links to the full gallery as well.
 */
export function ExampleGallery({ collapsible = false }: { collapsible?: boolean }) {
  const { t, i18n } = useTranslation();
  const examples = useExamples(i18n.language || currentLanguage());
  const preview = usePreviewParam();
  const [open, setOpen] = useState(storedOpen);
  const all = examples.data ?? [];
  const featured = easiestFirst(all.filter((example) => example.featured));
  const first = startHere(featured);
  const body = (
    <section className="example-gallery" aria-labelledby="example-gallery-title" data-testid="example-gallery">
      <header className="example-gallery__head">
        <div>
          {collapsible ? null : (
            <div className="titlebar__title">
              <LayoutTemplate size={16} aria-hidden className="example-gallery__icon" />
              <h2 id="example-gallery-title">{t("library.galleryTitle")}</h2>
              <DocLink to="beispiele" label={t("common.docsFor", { title: t("library.galleryTitle") })} />
            </div>
          )}
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
          <ExampleCard key={example.id} example={example} onOpen={preview.show} startHere={!collapsible && example.id === first} />
        ))}
      </div>
    </section>
  );
  const dialog = preview.open ? (
    <ExamplePreview key={preview.open} id={preview.open} onClose={preview.close} onCopied={(id) => preview.leave(`/workflows/${id}`)} />
  ) : null;
  if (!collapsible)
    return (
      <>
        {body}
        {dialog}
      </>
    );
  return (
    <>
      <Section
        id="example-gallery"
        className="example-gallery__section"
        title={t("library.galleryTitle")}
        icon={LayoutTemplate}
        summary={<span className="muted small">{t("library.galleryCount", { count: all.length || 24 })}</span>}
        open={open}
        onToggle={(next) => {
          setOpen(next);
          storeOpen(next);
        }}
      >
        <span id="example-gallery-title" hidden>
          {t("library.galleryTitle")}
        </span>
        {body}
      </Section>
      {dialog}
    </>
  );
}
