import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { AgentConfig, AgentDraft } from "../api/types";
import { useModelName } from "../components/ModelPicker";
import { Button, Callout, Chip, Field, Modal, TextArea } from "../components/ui";
import { ErrorText, ProblemText } from "../lib/errors";
import { formatCost, formatNumber } from "../lib/format";
import { useEditor } from "./store";

/** "Describe the agent you need": the Agent Architect proposes a configuration to review. */
export function DesignAgentDialog({
  open,
  onClose,
  onApply,
  initial = "",
  existing,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (config: AgentConfig) => void;
  initial?: string;
  existing?: string[];
}) {
  const { t } = useTranslation();
  const modelLabel = useModelName();
  const [description, setDescription] = useState(initial);
  const [draft, setDraft] = useState<AgentDraft | null>(null);
  useEffect(() => {
    if (open) {
      setDescription(initial);
      setDraft(null);
    }
  }, [open, initial]);
  const design = useMutation({
    mutationFn: () =>
      api.designAgent(description, existing ?? useEditor.getState().nodes.map((node) => node.label)),
    onSuccess: setDraft,
  });
  const config = draft?.config;
  return (
    <Modal
      title={t("editor.design.title")}
      open={open}
      onClose={onClose}
      wide
      footer={
        draft ? (
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {t("editor.design.backToDescription")}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onApply(draft.config);
                onClose();
              }}
            >
              {t("common.apply")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              icon={Sparkles}
              busy={design.isPending}
              disabled={!description.trim()}
              onClick={() => design.mutate()}
            >
              {t("editor.design.propose")}
            </Button>
          </>
        )
      }
    >
      {!draft ? (
        <>
          <Field label={t("editor.design.question")} hint={t("editor.design.hint")}>
            <TextArea
              rows={6}
              autoFocus
              value={description}
              placeholder={t("editor.design.placeholder")}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <p className="muted small" data-testid="design-cost-note">
            {t("editor.design.costNote")}
          </p>
          {design.error ? (
            <Callout tone="danger">
              <ErrorText error={design.error} />
            </Callout>
          ) : null}
        </>
      ) : config ? (
        <div className="draft">
          <Callout tone="brand">
            {t("editor.design.review")}
            {draft.cost_usd !== null ? ` ${t("editor.design.cost", { cost: formatCost(draft.cost_usd) })}` : null}
          </Callout>
          <dl className="draft__facts">
            <dt>{t("common.name")}</dt>
            <dd>{config.name}</dd>
            <dt>{t("editor.design.role")}</dt>
            <dd>{config.description}</dd>
            <dt>{t("agent.model")}</dt>
            <dd>
              {modelLabel(config.model)} · {t("agent.thinking.effortShort")}{" "}
              {t(`agent.options.effortShort.${config.effort ?? "default"}`)}
            </dd>
            <dt>{t("agent.tools.title")}</dt>
            <dd className="chip-row">
              {[...config.tools, ...config.server_tools].map((tool) => (
                <Chip key={tool}>{tool}</Chip>
              ))}
              {!config.tools.length && !config.server_tools.length ? <span className="muted">{t("common.none")}</span> : null}
            </dd>
            <dt>{t("editor.design.limits")}</dt>
            <dd>
              {t("editor.design.limitsValue", {
                tokens: formatNumber(config.max_tokens),
                rounds: formatNumber(config.max_tool_rounds),
              })}
            </dd>
          </dl>
          <Field label={t("agent.systemPrompt")}>
            <pre className="code-block code-block--prose">{config.system_prompt}</pre>
          </Field>
          {draft.missing_tools.length ? (
            <Callout tone="warning">
              {t("editor.design.missingTools")}{" "}
              {draft.missing_tools.map((tool) => (
                <span key={tool.name}>
                  <strong>{tool.name}</strong> ({tool.requirement}){" "}
                </span>
              ))}
              <Trans i18nKey="editor.design.missingToolsHint" components={{ a: <Link to="/tools" /> }} />
            </Callout>
          ) : null}
          {draft.notes.map((note, index) => (
            <p className="field__hint" key={index}>
              <ProblemText item={note} compact />
            </p>
          ))}
        </div>
      ) : null}
    </Modal>
  );
}
