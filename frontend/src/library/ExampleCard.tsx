import { Flag, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ExampleFeature, ExampleSummary } from "../api/types";
import { Badge, Hint } from "../components/ui";
import { CATEGORY_ICONS, PATTERN_ICONS } from "./examples";

/** Features worth a badge on the card (the building blocks beyond plain agents). */
const FLOW_FEATURES: ExampleFeature[] = [
  "orchestrator",
  "decision",
  "approval",
  "loop",
  "form",
  "subworkflow",
  "knowledge",
  "integration",
  "files",
  "documents",
];

/** A gallery card; clicking it opens the preview (which costs nothing). */
export function ExampleCard({
  example,
  onOpen,
  startHere = false,
  headingLevel = 3,
}: {
  example: ExampleSummary;
  onOpen: (id: string) => void;
  /** The easiest example, recommended as the first one to try. */
  startHere?: boolean;
  /** h2 directly under a page title, h3 inside a titled gallery (heading order, AX-08). */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const { t } = useTranslation();
  const Icon = CATEGORY_ICONS[example.category];
  const PatternIcon = PATTERN_ICONS[example.pattern];
  const shown = example.features.filter((feature) => FLOW_FEATURES.includes(feature));
  return (
    <article className="card card--link example-card" data-testid={`example-${example.id}`}>
      <button type="button" className="card__main example-card__main" onClick={() => onOpen(example.id)}>
        <div className="card__head">
          <span className="card__avatar">
            <Icon size={16} aria-hidden />
          </span>
          <div>
            <span className="example-card__field">{example.field}</span>
            <Heading>{example.name}</Heading>
          </div>
          {startHere ? (
            <Badge tone="success" icon={Flag}>
              <span data-testid="start-here">{t("library.startHere")}</span>
            </Badge>
          ) : null}
        </div>
        <p className="card__text">{example.description}</p>
        {shown.length ? (
          <div className="row-gap example-card__features">
            {shown.map((feature) => (
              <Badge key={feature} tone="running">
                {t(`library.feature.${feature}`)}
              </Badge>
            ))}
          </div>
        ) : null}
      </button>
      <footer className="card__foot example-card__foot">
        <span className="muted small">
          {t("library.agents", { count: example.agents })}
          {example.teams ? <> · {t("library.teams", { count: example.teams })}</> : null} · {t(`library.level.${example.level}`)}
        </span>
        <div className="row-gap">
          <Hint id={`library.${example.pattern}`}>
            <span className="example-card__pattern" tabIndex={0}>
              <PatternIcon size={12} aria-hidden /> {t(`library.pattern.${example.pattern}`)}
            </span>
          </Hint>
          {example.sensitive ? (
            <Hint id="library.sensitive">
              <span tabIndex={0}>
                <Badge tone="warning" icon={ShieldAlert}>
                  {t("library.sensitive")}
                </Badge>
              </span>
            </Hint>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
