import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { formatPrice } from "../lib/format";

import { api } from "./client";

export const keys = {
  meta: ["meta"] as const,
  settings: ["settings"] as const,
  workflows: ["workflows"] as const,
  workflow: (id: string) => ["workflow", id] as const,
  runs: (workflowId?: string) => ["runs", workflowId ?? "all"] as const,
  run: (id: string) => ["run", id] as const,
  usage: (days: number) => ["usage", days] as const,
  templates: ["templates"] as const,
  tools: ["tools"] as const,
  toolJobs: ["tool-jobs"] as const,
  toolDrafts: ["tool-drafts"] as const,
  python: ["python"] as const,
  dependencies: (kind: string, ref: string) => ["dependencies", kind, ref] as const,
  knowledge: (query?: string) => ["knowledge", query ?? ""] as const,
  memorySpaces: ["memory"] as const,
  memoryFiles: (space: string) => ["memory", space] as const,
  versions: (id: string) => ["versions", id] as const,
  organize: ["organize"] as const,
  examples: (language: string) => ["examples", language] as const,
  conversations: ["assistant", "conversations"] as const,
  conversation: (id: string) => ["assistant", "conversation", id] as const,
  example: (id: string, language: string) => ["example", id, language] as const,
  approvals: ["approvals"] as const,
  resultFiles: (runId: string) => ["result-files", runId] as const,
  batches: ["batches"] as const,
  batch: (id: string) => ["batch", id] as const,
  suites: ["suites"] as const,
  suite: (id: string) => ["suite", id] as const,
  benchmarkRuns: (suiteId: string) => ["benchmark-runs", suiteId] as const,
  schedules: ["schedules"] as const,
  inputFormats: ["input-formats"] as const,
  inputStorage: ["input-storage"] as const,
  runInputs: (runId: string) => ["run-inputs", runId] as const,
  collections: ["knowledge-collections"] as const,
  usedBy: (kind: string) => ["used-by", kind] as const,
};

export const useMeta = () => useQuery({ queryKey: keys.meta, queryFn: api.meta, staleTime: Infinity });
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: api.settings });
export const useWorkflows = () => useQuery({ queryKey: keys.workflows, queryFn: api.workflows });
export const useTemplates = () => useQuery({ queryKey: keys.templates, queryFn: api.templates });
export const useTools = () => useQuery({ queryKey: keys.tools, queryFn: api.tools });
export const useKnowledge = (query?: string) =>
  useQuery({ queryKey: keys.knowledge(query), queryFn: () => api.knowledge(query) });
export const useMemorySpaces = () => useQuery({ queryKey: keys.memorySpaces, queryFn: api.memorySpaces });
export const useRuns = (workflowId?: string) =>
  useQuery({ queryKey: keys.runs(workflowId), queryFn: () => api.runs(workflowId), refetchInterval: 5000 });
export const useUsage = (days: number) => useQuery({ queryKey: keys.usage(days), queryFn: () => api.usage(days) });
// The library never changes while the app runs, so its answers are cached for good.
export const useExamples = (language: string) =>
  useQuery({ queryKey: keys.examples(language), queryFn: () => api.examples(language), staleTime: Infinity });
export const useExample = (id: string | null, language: string) =>
  useQuery({
    queryKey: keys.example(id ?? "", language),
    queryFn: () => api.example(id ?? "", language),
    enabled: id !== null,
    staleTime: Infinity,
  });
/** Approvals waiting for a person; polled so the navigation badge stays current. */
export const useApprovals = () =>
  useQuery({ queryKey: keys.approvals, queryFn: api.approvals, refetchInterval: 5000 });
export const useBatches = () => useQuery({ queryKey: keys.batches, queryFn: api.batches, refetchInterval: 4000 });
export const useSuites = () => useQuery({ queryKey: keys.suites, queryFn: () => api.suites() });
export const useSchedules = () => useQuery({ queryKey: keys.schedules, queryFn: api.schedules, refetchInterval: 15000 });
export const useToolDrafts = () => useQuery({ queryKey: keys.toolDrafts, queryFn: api.toolDrafts });
export const useInputFormats = () =>
  useQuery({ queryKey: keys.inputFormats, queryFn: api.inputFormats, staleTime: Infinity });
export const useCollections = () => useQuery({ queryKey: keys.collections, queryFn: api.knowledgeCollections });
export const useOrganize = () => useQuery({ queryKey: keys.organize, queryFn: api.organize });

/** The models of the catalog with labels (only those of ``provider`` if given), for selects. */
export function useModelOptions(provider?: string) {
  const { t } = useTranslation();
  const meta = useMeta();
  return (meta.data?.models ?? [])
    .filter((model) => !provider || model.provider === provider)
    .map((model) => ({
      value: model.id,
      label: model.label,
      hint:
        model.input_usd_per_mtok === null || model.output_usd_per_mtok === null
          ? t("models.priceUnknown")
          : t("models.pricePerMTok", {
              input: formatPrice(model.input_usd_per_mtok),
              output: formatPrice(model.output_usd_per_mtok),
            }),
      group: model.recommended ? t("models.current") : t("models.older"),
    }));
}
