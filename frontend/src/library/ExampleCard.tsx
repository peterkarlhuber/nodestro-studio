import { GitBranch, GitFork, ShieldAlert, Workflow } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ExampleFeature, ExampleSummary } from "../api/types";
import { Badge, Hint } from "../components/ui";
import { CATEGORY_ICONS } from "./examples";

/** Features worth a badge on the card (the building blocks beyond plain agents). */
const FLOW_FEATURES: ExampleFeature[] = ["decision", "approval", "form", "subworkflow", "files", "documents"];

/** A gallery card; clicking it opens the preview (which costs nothing). */
export function ExampleCard({ example, onOpen }: { example: ExampleSummary; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const Icon = CATEGORY_ICONS[example.category];
  const PatternIcon = example.pattern === "parallel" ? GitFork : example.pattern === "branching" ? GitBranch : Workflow;
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
            <h3>{example.name}</h3>
          </div>
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
          {t("library.agents", { count: example.agents })} · {t(`library.level.${example.level}`)}
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
