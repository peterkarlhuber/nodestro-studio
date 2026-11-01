// The three ways to start a workflow, equally visible (UX-4, decision D3): with the Workflow Architect, from an
// example, or by hand. Large in the empty state, a single compact row above existing workflows. Each choice opens
// what already exists (the new-workflow dialog in the matching mode, the example gallery); nothing here creates a
// workflow by itself. Without a model connection (no AI provider for the default model) the empty state says so
// first and links to Settings, the example comes first, and "Create with AI" says it needs a model (OB-01, OB-04).

import { FilePlus2, KeyRound, LayoutTemplate, type LucideIcon, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button, Callout } from "../components/ui";

const EXAMPLES = "/workflows/examples";

interface StartChoicesProps {
  variant: "full" | "compact";
  onAi: () => void;
  onManual: () => void;
  /** No AI provider is set up for new agents: running and "Create with AI" need one first. */
  needsModel?: boolean;
}

function Choice({ icon: Icon, title, text, note }: { icon: LucideIcon; title: string; text: string; note?: string }) {
  return (
    <>
      <span className="start-choice__icon">
        <Icon size={18} aria-hidden />
      </span>
      <span className="start-choice__title">{title}</span>
      <span className="start-choice__text">{text}</span>
      {note ? (
        <span className="start-choice__note">
          <KeyRound size={12} aria-hidden /> {note}
        </span>
      ) : null}
    </>
  );
}

/** Running a workflow (or creating one with AI) needs a connection to an AI model; shown while none is set up. */
export function ModelNeeded({ forAi = false }: { forAi?: boolean }) {
  const { t } = useTranslation();
  return (
    <Callout tone="warning">
      <span data-testid="model-needed">
        {forAi ? t("workflows.start.aiModelNeeded") : t("workflows.start.modelNeeded")}{" "}
        <Link to="/settings">{t("workflows.start.modelNeededLink")}</Link>
      </span>
    </Callout>
  );
}

export function StartChoices({ variant, onAi, onManual, needsModel = false }: StartChoicesProps) {
  const { t } = useTranslation();
  if (variant === "compact") {
    return (
      <nav className="start-row" aria-label={t("workflows.start.label")}>
        <span className="muted small">{t("workflows.start.label")}</span>
        <Button size="sm" variant="ghost" icon={Sparkles} onClick={onAi}>
          {t("workflows.start.ai")}
        </Button>
        <Link to={EXAMPLES} className="nd-button nd-button--ghost nd-button--sm">
          <LayoutTemplate size={15} aria-hidden />
          {t("workflows.start.example")}
        </Link>
        <Button size="sm" variant="ghost" icon={FilePlus2} onClick={onManual}>
          {t("workflows.start.manual")}
        </Button>
      </nav>
    );
  }
  const ai = (
    <button key="ai" type="button" className="start-choice" onClick={onAi}>
      <Choice
        icon={Sparkles}
        title={t("workflows.start.ai")}
        text={t("workflows.start.aiText")}
        note={needsModel ? t("workflows.start.aiNeedsModel") : undefined}
      />
    </button>
  );
  const example = (
    <Link key="example" to={EXAMPLES} className="start-choice">
      <Choice icon={LayoutTemplate} title={t("workflows.start.example")} text={t("workflows.start.exampleText")} />
    </Link>
  );
  return (
    <div className="stack start-choices__wrap">
      {needsModel ? <ModelNeeded /> : null}
      <div className="start-choices" role="group" aria-label={t("workflows.start.label")}>
        {/* Without a model the example is the first step that works (copying needs no model). */}
        {needsModel ? [example, ai] : [ai, example]}
        <button type="button" className="start-choice" onClick={onManual}>
          <Choice icon={FilePlus2} title={t("workflows.start.manual")} text={t("workflows.start.manualText")} />
        </button>
      </div>
    </div>
  );
}
