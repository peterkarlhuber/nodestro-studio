import { Blocks, BookMarked, Bot, LayoutTemplate } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useExamples } from "../api/hooks";
import type { ExampleCategory, ExampleLevel } from "../api/types";
import { Callout, EmptyState, PageHeader, Segmented, Select, Spinner, TextInput } from "../components/ui";
import { currentLanguage } from "../i18n";
import { ExampleCard } from "../library/ExampleCard";
import { ExamplePreview } from "../library/ExamplePreview";
import { LibraryParts } from "../library/LibraryParts";
import { LibrarySkills } from "../library/LibrarySkills";
import { CATEGORIES, LEVELS, byLevel, type ExampleLabels, filterExamples, isCategory, isLevel, startHere, startHereFirst } from "../library/examples";
import { usePreviewParam } from "../library/previewParam";
import { ErrorText } from "../lib/errors";
import { LibraryAgents } from "./agents/LibraryAgents";

type CategoryFilter = ExampleCategory | "all";
type LevelFilter = ExampleLevel | "all";

/** The kinds of entries of the shared library gallery (NAL-B3); examples are the default. */
export const LIBRARY_KINDS = ["examples", "parts", "agents", "skills"] as const;
export type LibraryKind = (typeof LIBRARY_KINDS)[number];
const isKind = (value: string | null): value is LibraryKind => LIBRARY_KINDS.includes(value as LibraryKind);
const KIND_ICONS = { examples: LayoutTemplate, parts: Blocks, agents: Bot, skills: BookMarked };

/**
 * All examples of the library, inside the workflow area, beginner examples first. The search (?q=), category
 * (?category=) and level (?level=) live in the URL, so Back returns to the same selection; ?template=<id> (also from
 * the global search) opens that example's preview. The kind filter (?kind=parts|agents|skills, NAL-B3) shows the
 * library's building blocks, agent templates or skills instead; ?part= and ?skill= open their previews.
 */
export function ExamplesPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const preview = usePreviewParam();
  const examples = useExamples(i18n.language || currentLanguage());
  const navigate = useNavigate();
  const kind: LibraryKind = isKind(params.get("kind")) ? (params.get("kind") as LibraryKind) : "examples";
  const language = i18n.language || currentLanguage();
  const query = params.get("q") ?? "";
  const category: CategoryFilter = isCategory(params.get("category")) ? (params.get("category") as ExampleCategory) : "all";
  const level: LevelFilter = isLevel(params.get("level")) ? (params.get("level") as ExampleLevel) : "all";

  /** Filter changes replace the entry: Back leaves the gallery instead of undoing every keystroke. */
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const labels: ExampleLabels = {
    category: (item) => t(`library.category.${item}`),
    level: (item) => t(`library.level.${item}`),
    pattern: (item) => t(`library.pattern.${item}`),
    feature: (item) => t(`library.feature.${item}`),
  };
  const all = examples.data ?? [];
  const first = startHere(all);
  const shown = startHereFirst(
    byLevel(filterExamples(all, query, category === "all" ? null : category, labels, level === "all" ? null : level)),
    first,
  );

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
        <Segmented<LibraryKind>
          label={t("library.kinds.label")}
          value={kind}
          onChange={(value) => update({ kind: value === "examples" ? null : value, part: null, skill: null })}
          options={LIBRARY_KINDS.map((item) => ({
            value: item,
            label: t(`library.kinds.${item}`),
            icon: KIND_ICONS[item],
            testId: `library-kind-${item}`,
          }))}
        />
        <div className="page__filters example-filters">
          <div className="example-filters__row">
            <TextInput
              type="search"
              value={query}
              onChange={(event) => update({ q: event.target.value || null })}
              placeholder={kind === "examples" ? t("library.searchPlaceholderFeatures") : t("library.kinds.searchPlaceholder")}
              aria-label={kind === "examples" ? t("library.searchLabel") : t("library.kinds.searchLabel")}
            />
            {kind === "examples" ? (
              <Select
                aria-label={t("library.levelLabel")}
                value={level}
                onChange={(value) => update({ level: isLevel(value) ? value : null })}
                options={[
                  { value: "all", label: t("library.allLevels") },
                  ...LEVELS.map((item) => ({ value: item, label: t(`library.level.${item}`) })),
                ]}
              />
            ) : null}
          </div>
          {kind === "examples" ? (
            <Segmented<CategoryFilter>
              label={t("library.categories")}
              value={category}
              onChange={(value) => update({ category: value === "all" ? null : value })}
              options={[
                { value: "all", label: t("library.allCategories") },
                ...CATEGORIES.map((item) => ({ value: item, label: labels.category(item) })),
              ]}
            />
          ) : null}
        </div>
        {kind === "parts" ? (
          <LibraryParts
            language={language}
            query={query}
            open={params.get("part")}
            onOpen={(id) => update({ part: id })}
            onClose={() => update({ part: null })}
            onCopied={(id) => navigate(`/workflows/${id}`)}
          />
        ) : null}
        {kind === "agents" ? (
          <LibraryAgents defaultOpen onCopied={(template) => navigate(`/agents?template=${encodeURIComponent(template.id)}`)} />
        ) : null}
        {kind === "skills" ? (
          <LibrarySkills
            language={language}
            query={query}
            open={params.get("skill")}
            onOpen={(name) => update({ skill: name })}
            onClose={() => update({ skill: null })}
            onCopied={(id) => navigate(`/skills?skill=${encodeURIComponent(id)}`)}
          />
        ) : null}
        {kind === "examples" ? (
          <>
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
                  <ExampleCard key={example.id} example={example} onOpen={preview.show} startHere={example.id === first} headingLevel={2} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
      {preview.open ? (
        <ExamplePreview key={preview.open} id={preview.open} onClose={preview.close} onCopied={(id) => preview.leave(`/workflows/${id}`)} />
      ) : null}
    </div>
  );
}
