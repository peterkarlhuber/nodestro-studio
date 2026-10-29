// What an agent receives: system prompt, task with its filled placeholders, and the other parts
// of its context (examples, tools, knowledge, memory, output format). Used for the preview in the
// inspector (before a run) and for the "Context" tab of a finished run.

import { BookOpen, Brain, FileText, MessagesSquare, ShieldCheck, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { ExampleMessage, KnowledgeRef, OutputConfig, PromptSegment } from "../api/types";
import { Badge, Chip, Tooltip } from "../components/ui";
import { problemText } from "../lib/errors";
import { redact } from "../lib/redact";

export interface AgentContext {
  model: string;
  system_prompt: string;
  segments: PromptSegment[];
  examples: ExampleMessage[];
  tools: string[];
  server_tools: string[];
  knowledge_mode: string;
  knowledge: KnowledgeRef[];
  run_files: KnowledgeRef[];
  memory_mode: string;
  memory_space: string | null;
  /** Number of files in the memory space, when known. */
  memory_files?: number | null;
  output: OutputConfig;
  quality: boolean;
  request_options: Record<string, unknown>;
}

/** The task with every inserted input marked: where it comes from, or that it is still missing. */
export function PromptSegments({ segments }: { segments: PromptSegment[] }) {
  const { t } = useTranslation();
  return (
    <pre className="code-block code-block--prose prompt-preview" data-testid="prompt-preview">
      {segments.map((segment, index) => {
        if (segment.kind === "text") return <span key={index}>{segment.text}</span>;
        if (segment.kind === "pending")
          return (
            <Tooltip key={index} content={t("context.pendingHint", { name: segment.label ?? "" })}>
              <mark className="prompt-slot prompt-slot--pending" tabIndex={0}>
                {t("context.pending", { name: segment.label ?? "" })}
              </mark>
            </Tooltip>
          );
        const label = segment.kind === "run_input" ? t("context.runInput") : (segment.label ?? "");
        return (
          <Tooltip key={index} content={t("context.insertedFrom", { name: label })}>
            <mark className={`prompt-slot prompt-slot--${segment.kind}`} tabIndex={0}>
              {segment.text || <em>{t("context.empty")}</em>}
              {segment.truncated ? <em> {t("context.truncated")}</em> : null}
            </mark>
          </Tooltip>
        );
      })}
    </pre>
  );
}

function Part({ icon: Icon, title, children }: { icon: typeof Wrench; title: string; children: ReactNode }) {
  return (
    <div className="context-part">
      <span className="context-part__title">
        <Icon size={13} aria-hidden /> {title}
      </span>
      <div className="context-part__body">{children}</div>
    </div>
  );
}

function files(t: ReturnType<typeof useTranslation>["t"], refs: KnowledgeRef[]) {
  return refs.map((ref) => {
    const chip = (
      <Chip key={ref.id} icon={FileText}>
        {ref.missing ? t("context.fileMissing") : (ref.name ?? ref.id)}
        {ref.mode ? <small className="chip__mode"> · {t(`inputs.modes.${ref.mode}`)}</small> : null}
      </Chip>
    );
    if (!ref.mode) return chip;
    const notes = (ref.notes ?? []).map((note) => problemText(t, { code: note, params: { name: ref.name ?? "" } }));
    return (
      <Tooltip key={ref.id} content={[t(`inputs.modeHints.${ref.mode}`), ...notes].join(" ")}>
        <span tabIndex={0}>{chip}</span>
      </Tooltip>
    );
  });
}

export function ContextView({ context, extra }: { context: AgentContext; extra?: ReactNode }) {
  const { t } = useTranslation();
  const options = redact(context.request_options) as Record<string, unknown>;
  return (
    <div className="context-view stack-sm">
      <div>
        <span className="nd-field-label">{t("context.system")}</span>
        <pre className="code-block code-block--prose">{context.system_prompt || "–"}</pre>
      </div>
      <div>
        <span className="nd-field-label">{t("context.task")}</span>
        <PromptSegments segments={context.segments} />
      </div>
      {extra}
      <div className="context-parts">
        <Part icon={MessagesSquare} title={t("context.examples")}>
          {context.examples.length ? (
            <details>
              <summary>{t("context.exampleCount", { count: context.examples.length })}</summary>
              {context.examples.map((message, index) => (
                <div key={index} className="small">
                  <strong>{t(`context.role.${message.role}`)}:</strong> {message.content}
                </div>
              ))}
            </details>
          ) : (
            <span className="muted">{t("common.none")}</span>
          )}
        </Part>
        <Part icon={Wrench} title={t("context.tools")}>
          {context.tools.length || context.server_tools.length ? (
            <div className="chip-row">
              {[...context.tools, ...context.server_tools].map((name) => (
                <Chip key={name} icon={Wrench}>
                  {name}
                </Chip>
              ))}
            </div>
          ) : (
            <span className="muted">{t("common.none")}</span>
          )}
        </Part>
        <Part icon={BookOpen} title={t("context.knowledge")}>
          {context.knowledge.length ? (
            <>
              <Badge>{t(`context.knowledgeMode.${context.knowledge_mode}`)}</Badge>
              <div className="chip-row">{files(t, context.knowledge)}</div>
            </>
          ) : (
            <span className="muted">{t("common.none")}</span>
          )}
          {context.run_files.length ? (
            <div className="small">
              {t("context.runFiles")} <span className="chip-row">{files(t, context.run_files)}</span>
            </div>
          ) : null}
        </Part>
        <Part icon={Brain} title={t("context.memory")}>
          {context.memory_mode === "none" ? (
            <span className="muted">{t("common.none")}</span>
          ) : context.memory_mode === "run" ? (
            t("context.memoryRun")
          ) : (
            t("context.memoryPersistent", {
              space: context.memory_space ?? "",
              count: context.memory_files ?? 0,
            })
          )}
        </Part>
        <Part icon={FileText} title={t("context.output")}>
          {context.output.mode === "structured"
            ? t("context.outputStructured", {
                name: context.output.name,
                fields: context.output.fields.map((field) => field.name).join(", "),
              })
            : t("context.outputText")}
        </Part>
        <Part icon={ShieldCheck} title={t("context.quality")}>
          {context.quality ? t("context.qualityOn") : <span className="muted">{t("context.qualityOff")}</span>}
        </Part>
      </div>
      {Object.keys(options).length ? (
        <details>
          <summary className="small">{t("context.requestOptions")}</summary>
          <pre className="code-block">{JSON.stringify(options, null, 2)}</pre>
        </details>
      ) : null}
      <p className="muted small">{t("context.secretsHidden")}</p>
    </div>
  );
}
