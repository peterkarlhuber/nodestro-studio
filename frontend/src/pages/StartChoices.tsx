// The three ways to start a workflow, equally visible (UX-4, decision D3): with the Workflow Architect, from an
// example, or by hand. Large in the empty state, a single compact row above existing workflows. Each choice opens
// what already exists (the new-workflow dialog in the matching mode, the example gallery); nothing here creates a
// workflow by itself.

import { FilePlus2, LayoutTemplate, type LucideIcon, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Button } from "../components/ui";

const EXAMPLES = "/workflows/examples";

interface StartChoicesProps {
  variant: "full" | "compact";
  onAi: () => void;
  onManual: () => void;
}

function Choice({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <>
      <span className="start-choice__icon">
        <Icon size={18} aria-hidden />
      </span>
      <span className="start-choice__title">{title}</span>
      <span className="start-choice__text">{text}</span>
    </>
  );
}

export function StartChoices({ variant, onAi, onManual }: StartChoicesProps) {
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
  return (
    <div className="start-choices" role="group" aria-label={t("workflows.start.label")}>
      <button type="button" className="start-choice" onClick={onAi}>
        <Choice icon={Sparkles} title={t("workflows.start.ai")} text={t("workflows.start.aiText")} />
      </button>
      <Link to={EXAMPLES} className="start-choice">
        <Choice icon={LayoutTemplate} title={t("workflows.start.example")} text={t("workflows.start.exampleText")} />
      </Link>
      <button type="button" className="start-choice" onClick={onManual}>
        <Choice icon={FilePlus2} title={t("workflows.start.manual")} text={t("workflows.start.manualText")} />
      </button>
    </div>
  );
}
