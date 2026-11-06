// "Fix" next to a problem that a missing local model causes (a workflow check, a failed or refused run, a schedule's
// or a batch's last error): opens the same dialog as the actions do, without continuing anything by itself. Unattended
// runs never download; this is how an authorized person fixes what they reported.

import { QueryClientContext } from "@tanstack/react-query";
import { Wrench } from "lucide-react";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";

import { problemModel } from "../api/modelReadiness";
import { toast } from "../components/toast";
import { Button } from "../components/ui";
import { fixMissingModel } from "./store";

export function ModelFixButton({ item }: { item: { code?: string | null; params?: Record<string, unknown> | null } }) {
  const { t } = useTranslation();
  const queryClient = useContext(QueryClientContext);
  const [busy, setBusy] = useState(false);
  const model = problemModel(item);
  if (!model) return null;
  const name = model.replace(/^ollama:/, "");
  return (
    <Button
      size="sm"
      icon={Wrench}
      busy={busy}
      className="model-fix"
      data-testid="model-fix"
      aria-label={t("missingModel.fix.label", { model: name })}
      onClick={(event) => {
        // Inside a clickable row (the check list selects the node): only the fix.
        event.stopPropagation();
        setBusy(true);
        fixMissingModel(model)
          .then((fixed) => {
            if (fixed) void queryClient?.invalidateQueries();
          })
          .catch((error) => toast.error(error))
          .finally(() => setBusy(false));
      }}
    >
      {t("missingModel.fix.button")}
    </Button>
  );
}
