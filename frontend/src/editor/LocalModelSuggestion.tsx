// Which local model suits this agent's task on the computer (or server) that runs the model server (ST-044). Shown
// next to the model picker for an agent on a local model; it never changes the model by itself.

import { useQuery } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { localApi, localKeys } from "../api/localModels";
import type { AgentConfig } from "../api/types";
import { useModelName } from "../components/ModelPicker";
import { Button } from "../components/ui";
import { formatLargeBytes } from "../lib/format";
import { agentTask, reasonText } from "../lib/localRecommend";

export function LocalModelSuggestion({ agent, onUse }: { agent: AgentConfig; onUse: (model: string) => void }) {
  const { t } = useTranslation();
  const modelName = useModelName();
  const server = useAccess().profile === "server";
  const local = agent.model.startsWith("ollama:");
  const task = agentTask(agent);
  const found = useQuery({
    queryKey: localKeys.recommend(task),
    queryFn: () => localApi.recommend(task),
    enabled: local,
    staleTime: 60_000,
    retry: false,
  });
  // Without a local model, or when the API cannot say (older API, no model server), nothing is shown.
  if (!local || !found.data || !Array.isArray(found.data.reasons)) return null;
  const item = found.data;
  const taskName = t(`localModels.tasks.${task}`);
  const why = reasonText(t, item, server);
  if (!item.model)
    return (
      <p className="field__hint local-suggestion" data-testid="local-suggestion">
        <Cpu size={12} aria-hidden /> {t("agent.localSuggestion.none", { task: taskName })} {why}
      </p>
    );
  if (item.model === agent.model)
    return (
      <p className="field__hint local-suggestion" data-testid="local-suggestion">
        <Cpu size={12} aria-hidden /> {t("agent.localSuggestion.current", { task: taskName })}
      </p>
    );
  const suggested = item.model;
  return (
    <div className="field__hint local-suggestion" data-testid="local-suggestion">
      <span>
        <Cpu size={12} aria-hidden />{" "}
        {t("agent.localSuggestion.other", {
          task: taskName,
          model: modelName(suggested),
          quality: t(`localModels.quality.${item.quality}`),
        })}{" "}
        {item.installed ? null : t("agent.localSuggestion.download", { size: formatLargeBytes(item.download_bytes) })} {why}
      </span>
      <Button size="sm" variant="ghost" onClick={() => onUse(suggested)}>
        {t("agent.localSuggestion.use")}
      </Button>
    </div>
  );
}
