import { LayoutTemplate } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { useExamples } from "../api/hooks";
import type { ExampleCategory } from "../api/types";
import { Callout, EmptyState, PageHeader, Segmented, Spinner, TextInput } from "../components/ui";
import { currentLanguage } from "../i18n";
import { ExampleCard } from "../library/ExampleCard";
import { ExamplePreview } from "../library/ExamplePreview";
import { CATEGORIES, filterExamples, isCategory } from "../library/examples";
import { ErrorText } from "../lib/errors";

type CategoryFilter = ExampleCategory | "all";

/**
 * All examples of the library, inside the workflow area. ?category= preselects a category,
 * ?template=<id> (from the global search) opens that example's preview.
 */
export function ExamplesPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const examples = useExamples(i18n.language || currentLanguage());
  const [query, setQuery] = useState("");
  const category: CategoryFilter = isCategory(params.get("category")) ? (params.get("category") as ExampleCategory) : "all";
  const open = params.get("template");

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const label = (item: ExampleCategory) => t(`library.category.${item}`);
  const shown = filterExamples(examples.data ?? [], query, category === "all" ? null : category, label);

  return (
    <div className="page">
      <PageHeader
        title={t("library.title")}
        doc="beispiele"
        description={t("library.description")}
        crumbs={
          <>
            <Link to="/">{t("workflows.title")}</Link> / <span>{t("library.title")}</span>
          </>
        }
      />
      <div className="page__body">
        <div className="page__filters example-filters">
          <TextInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("library.searchPlaceholder")}
            aria-label={t("library.searchLabel")}
          />
          <Segmented<CategoryFilter>
            label={t("library.categories")}
            value={category}
            onChange={(value) => update({ category: value === "all" ? null : value })}
            options={[
              { value: "all", label: t("library.allCategories") },
              ...CATEGORIES.map((item) => ({ value: item, label: label(item) })),
            ]}
          />
        </div>
        {examples.isLoading ? <Spinner /> : null}
        {examples.error ? (
          <Callout tone="danger">
            <ErrorText error={examples.error} />
          </Callout>
        ) : null}
        {examples.data ? (
          <p className="muted small" aria-live="polite">
            {t("library.results", { count: shown.length })}
          </p>
        ) : null}
        {examples.data && !shown.length ? (
          <EmptyState icon={LayoutTemplate} title={t("library.noMatch")} />
        ) : (
          <div className="card-grid">
            {shown.map((example) => (
              <ExampleCard key={example.id} example={example} onOpen={(id) => update({ template: id })} />
            ))}
          </div>
        )}
      </div>
      {open ? <ExamplePreview key={open} id={open} onClose={() => update({ template: null })} /> : null}
    </div>
  );
}
