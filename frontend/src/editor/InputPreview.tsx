// "Input preview" in the agent inspector: what the agent would receive if the workflow ran now.
// Predecessor results come from the latest finished run; missing ones are marked as pending.
// The preview is computed by the server without any API call and is only loaded when opened.

import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import type { WorkflowNode } from "../api/types";
import { Badge, Callout, Section, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatDate } from "../lib/format";
import { ContextView } from "./ContextView";
import { useEditor } from "./store";

function useDebouncedWorkflow(enabled: boolean) {
  const nodes = useEditor((s) => s.nodes);
  const edges = useEditor((s) => s.edges);
  const [value, setValue] = useState(() => useEditor.getState().toWorkflow());
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => setValue(useEditor.getState().toWorkflow()), 400);
    return () => window.clearTimeout(timer);
  }, [nodes, edges, enabled]);
  return value;
}

export function InputPreview({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const workflowId = useEditor((s) => s.workflowId);
  const workflow = useDebouncedWorkflow(open);
  const preview = useQuery({
    queryKey: ["preview", workflowId, node.id, workflow],
    queryFn: () => api.previewContext({ workflow, node_id: node.id, workflow_id: workflowId ?? undefined }),
    enabled: open,
    staleTime: 10_000,
  });
  const data = preview.data;
  return (
    // A Section, so the help button stands next to the summary and not inside it (AX-09).
    <Section
      title={t("preview.title")}
      icon={Eye}
      tip="agent.preview"
      id="input-preview"
      onToggle={setOpen}
      summary={data ? (data.complete ? t("preview.complete") : t("preview.incomplete")) : undefined}
    >
      <div className="stack-sm" data-testid="input-preview">
        {preview.isLoading ? <Spinner /> : null}
        {preview.error ? (
          <Callout tone="danger">
            <ErrorText error={preview.error} />
          </Callout>
        ) : null}
        {data ? (
          <>
            <p className="muted small">
              {data.run_id
                ? t("preview.fromRun", { date: data.run_created_at ? formatDate(data.run_created_at) : "" })
                : t("preview.noRun")}{" "}
              {data.run_input_source === "given" ? null : t(`preview.source.${data.run_input_source}`)}
            </p>
            {data.inputs.length ? (
              <ul className="preview-inputs">
                {data.inputs.map((input) => (
                  <li key={input.node_id}>
                    <Badge tone={input.status === "available" ? "success" : "warning"}>
                      {input.status === "available" ? t("preview.available") : t("preview.pending")}
                    </Badge>{" "}
                    <strong>{input.label}</strong>{" "}
                    <span className="muted small">
                      {input.status === "available"
                        ? t("preview.chars", { count: input.chars })
                        : input.run_status
                          ? t("preview.runStatus", { status: t(`status.${input.run_status}.label`) })
                          : t("preview.noResult")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {data.placeholders
              .filter((item) => item.status === "not_connected" || item.status === "unknown")
              .map((item) => (
                <Callout key={item.name} tone="warning">
                  {t(`preview.placeholder.${item.status}`, { name: item.name })}
                </Callout>
              ))}
            <ContextView context={data} />
          </>
        ) : null}
      </div>
    </Section>
  );
}
