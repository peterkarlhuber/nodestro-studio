import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Brain,
  Copy,
  Gauge,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  FileJson,
  FlaskConical,
} from "lucide-react";
import type { TFunction } from "i18next";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { keys, useKnowledge, useMemorySpaces, useMeta, useModelOptions, useTools } from "../api/hooks";
import type {
  AgentConfig,
  ConfigIssue,
  ContentKind,
  KnowledgeFile,
  KnowledgeProposalConfig,
  Workflow,
  WorkflowNode,
} from "../api/types";
import { DiscussIcon } from "../assistant/DiscussButton";
import type { ContextOffer } from "../assistant/store";
import { useContextOffer } from "../assistant/useContextOffer";
import { CodeEditor } from "../components/CodeEditor";
import { ModelPicker, providerLabel, useModelHint } from "../components/ModelPicker";
import { HelpTip } from "../components/Tooltip";
import { AGENT_ICONS } from "../components/icons";
import { toast } from "../components/toast";
import {
  Button,
  Callout,
  Chip,
  Field,
  Hint,
  IconButton,
  Section,
  type SectionStatus,
  Segmented,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "../components/ui";
import { AgentTestDialog } from "./AgentTestDialog";
import { DesignAgentDialog } from "./DesignAgentDialog";
import { InputPreview } from "./InputPreview";
import { MemoryAssistantDialog } from "./MemoryAssistantDialog";
import { OutputFieldsEditor } from "./OutputFieldsEditor";
import { serverToolDescription, serverToolLabel, toolDescription } from "../lib/catalog";
import { getDefaultModel } from "../lib/defaults";
import { providerOf, sameModel, splitModel } from "../lib/providers";
import { ProblemText } from "../lib/errors";
import { KNOWLEDGE_ACCEPT } from "../lib/knowledge";
import {
  type AgentSectionId,
  advancedSummary,
  knowledgeSummary,
  sectionStatus,
  thinkingSummary,
  unroutedIssues,
} from "./agentSummaries";
import { useAgentSections } from "./sectionState";
import { removeWithUndo } from "./actions";
import { useEditor } from "./store";

// Option values are what the library expects; labels come from agent.options.* in the language files.
const EFFORTS = ["", "low", "medium", "high", "xhigh", "max"] as const;
const THINKING = ["", "adaptive", "between_tools", "disabled"] as const;
const THINKING_DISPLAY = ["", "summarized", "updates", "omitted"] as const;

/** The sections in the order of the form, with their titles (for the problem links at the top). */
const SECTION_ORDER: AgentSectionId[] = ["tools", "knowledge", "memory", "output", "thinking", "quality", "advanced"];
const SECTION_TITLE: Record<AgentSectionId, string> = {
  tools: "agent.tools.title",
  knowledge: "agent.knowledge.title",
  memory: "agent.memory.title",
  output: "agent.output.title",
  thinking: "agent.thinking.title",
  quality: "agent.quality.title",
  advanced: "agent.advanced.title",
};

/** Select options from option values; "" is the model default. */
function options(t: TFunction, group: string, values: readonly string[]) {
  return values.map((value) => ({ value, label: t(`agent.options.${group}.${value || "default"}`) }));
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useIssues(agent: AgentConfig): ConfigIssue[] {
  const debounced = useDebounced(agent, 350);
  const query = useQuery({
    queryKey: ["validate", debounced],
    queryFn: () => api.validateAgent(debounced),
    staleTime: 60_000,
  });
  return query.data ?? [];
}

function FieldErrors({ issues, field }: { issues: ConfigIssue[]; field: string }) {
  const mine = issues.filter((issue) => issue.field === field && issue.level !== "info");
  if (!mine.length) return null;
  return (
    <>
      {mine.map((issue) => (
        <Callout key={issue.message} tone={issue.level === "error" ? "danger" : "warning"}>
          <ProblemText item={issue} />
        </Callout>
      ))}
    </>
  );
}

export function AgentInspector({ node }: { node: WorkflowNode }) {
  const { t } = useTranslation();
  const { updateAgent, replaceAgent, duplicateNode } = useEditor.getState();
  const nodes = useEditor((s) => s.nodes);
  const edges = useEditor((s) => s.edges);
  const upstream = useMemo(
    () =>
      edges
        .filter((edge) => edge.target === node.id)
        .map((edge) => nodes.find((item) => item.id === edge.source))
        .filter((item): item is WorkflowNode => Boolean(item)),
    [edges, nodes, node.id],
  );
  const agent = node.agent!;
  const start = nodes.find((item) => item.type === "start");
  const workflowId = useEditor((s) => s.workflowId);
  const dirty = useEditor((s) => s.dirty);
  // A node that is not saved yet exists only as a draft.
  const saved = useQueryClient().getQueryData<Workflow>(keys.workflow(workflowId ?? ""));
  const draftOnly = Boolean(saved && !saved.nodes.some((item) => item.id === node.id));
  const offer: ContextOffer | null = workflowId
    ? {
        kind: "agent",
        refId: `${workflowId}/${node.id}`,
        label: agent.name || node.label,
        dirty: dirty || draftOnly,
        draftOnly,
        draft: () => useEditor.getState().toWorkflow(),
      }
    : null;
  useContextOffer("editor-node", offer);

  const saveTemplate = async () => {
    try {
      await api.createTemplate(agent);
      toast.success(t("agent.savedAsTemplate", { name: agent.name }));
    } catch (error) {
      toast.error(error);
    }
  };

  return (
    <AgentForm
      agent={agent}
      onChange={(patch) => updateAgent(node.id, patch)}
      onReplace={(config) => replaceAgent(node.id, config)}
      placeholders={upstream.map((item) => item.label)}
      existing={nodes.map((item) => item.label)}
      testInput={start?.start?.default_input ?? ""}
      preview={<InputPreview node={node} />}
      actions={
        <>
          <DiscussIcon offer={offer} />
          <IconButton icon={Save} label={t("agent.saveAsTemplate")} onClick={saveTemplate} />
          <IconButton icon={Copy} label={t("agent.duplicate")} onClick={() => duplicateNode(node.id)} />
          <IconButton icon={Trash2} label={t("agent.delete")} onClick={() => removeWithUndo([node.id])} />
        </>
      }
    />
  );
}

/** The complete agent configuration with progressive disclosure; used in the editor and the agent library. */
export function AgentForm({
  agent,
  onChange,
  onReplace,
  placeholders = [],
  existing = [],
  actions,
  testInput = "",
  preview,
}: {
  agent: AgentConfig;
  onChange: (patch: Partial<AgentConfig>) => void;
  onReplace: (agent: AgentConfig) => void;
  placeholders?: string[];
  existing?: string[];
  actions?: ReactNode;
  /** Prefilled input for "Test agent", e.g. the default input of the workflow. */
  testInput?: string;
  /** Shown below the task: the input preview in the workflow editor. */
  preview?: ReactNode;
}) {
  const { t } = useTranslation();
  const modelOptions = useModelOptions("anthropic");
  const modelHint = useModelHint(agent.model);
  const issues = useIssues(agent);
  const [designOpen, setDesignOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const update = onChange;

  const general = [...issues.filter((issue) => !issue.field && issue.level === "error"), ...unroutedIssues(issues)];
  const root = useRef<HTMLDivElement>(null);
  // Undefined: the section keeps its own default; remembered (per section, in this browser) once the user toggles it
  // or a problem link opens it.
  const openSections = useAgentSections((state) => state.open);
  const setSectionOpen = useAgentSections((state) => state.setOpen);
  const ui = (id: AgentSectionId): SectionUi => ({
    id,
    open: openSections[id],
    onToggle: (open) => setSectionOpen(id, open),
    status: sectionStatus(issues, id),
  });
  const withProblems = SECTION_ORDER.filter((id) => {
    const status = sectionStatus(issues, id);
    return Boolean(status.errors || status.warnings);
  });
  const showSection = (id: AgentSectionId) => {
    setSectionOpen(id, true);
    // After React has opened it: bring it into view and put the focus on its first control.
    window.requestAnimationFrame(() => {
      const section = root.current?.querySelector<HTMLElement>(`[data-section="${id}"]`);
      section?.scrollIntoView?.({ block: "nearest" });
      section?.querySelector<HTMLElement>(".section__body input, .section__body select, .section__body textarea, .section__body button")?.focus();
    });
  };

  return (
    <div className="inspector__content" ref={root}>
      <div className="inspector__head">
        <IconPicker value={agent.icon} onChange={(icon) => update({ icon })} />
        <div className="inspector__title">
          <input
            className="title-input"
            value={agent.name}
            onChange={(e) => update({ name: e.target.value })}
            aria-label={t("agent.nameLabel")}
          />
          <input
            className="subtitle-input"
            value={agent.description}
            placeholder={t("agent.descriptionPlaceholder")}
            onChange={(e) => update({ description: e.target.value })}
            aria-label={t("agent.descriptionLabel")}
          />
        </div>
      </div>

      <div className="inspector__actions">
        <Hint id="agent.design">
          <Button size="sm" icon={Sparkles} onClick={() => setDesignOpen(true)}>
            {t("agent.designWithAi")}
          </Button>
        </Hint>
        <Hint id="agent.test">
          <Button size="sm" icon={FlaskConical} onClick={() => setTestOpen(true)}>
            {t("agentTest.button")}
          </Button>
        </Hint>
        {actions}
      </div>

      {general.map((issue) => (
        <Callout key={issue.message} tone={issue.level === "warning" ? "warning" : "danger"}>
          <ProblemText item={issue} />
        </Callout>
      ))}

      {withProblems.length ? (
        <div className="section-problems" role="group" aria-label={t("agent.summary.problemsIn")}>
          <span className="muted small">{t("agent.summary.problemsIn")}</span>
          {withProblems.map((id) => {
            const status = sectionStatus(issues, id);
            return (
              <button key={id} type="button" className="chip chip--button" onClick={() => showSection(id)}>
                {t(SECTION_TITLE[id])}:{" "}
                {[
                  status.errors ? t("common.sectionErrors", { count: status.errors }) : "",
                  status.warnings ? t("common.sectionWarnings", { count: status.warnings }) : "",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </button>
            );
          })}
        </div>
      ) : null}

      <Field
        label={t("agent.model")}
        htmlFor="agent-model"
        tip="agent.model"
        hint={modelHint}
      >
        <ModelPicker id="agent-model" value={agent.model} onChange={(model) => update({ model })} />
      </Field>

      <Field label={t("agent.systemPrompt")} htmlFor="agent-system" tip="agent.systemPrompt" hint={t("agent.systemPromptHint")}>
        <TextArea
          id="agent-system"
          rows={6}
          value={agent.system_prompt}
          onChange={(e) => update({ system_prompt: e.target.value })}
        />
      </Field>

      <Field
        label={t("agent.task")}
        htmlFor="agent-task"
        tip="agent.task"
        hint={
          <Trans
            i18nKey="agent.taskHint"
            values={{ input: "{{input}}", runInput: "{{run.input}}" }}
            components={{ code: <code /> }}
            shouldUnescape
            tOptions={{ interpolation: { escapeValue: false } }}
          />
        }
      >
        <TextArea
          id="agent-task"
          rows={3}
          value={agent.task_template}
          onChange={(e) => update({ task_template: e.target.value })}
        />
        {placeholders.length ? (
          <div className="chip-row" aria-label={t("agent.insertPlaceholder")}>
            <HelpTip id="agent.placeholders" label={t("agent.placeholders")} />
            {placeholders.map((label) => (
              <button
                key={label}
                type="button"
                className="chip chip--button"
                onClick={() => update({ task_template: `${agent.task_template}{{${label}}}` })}
              >
                <Plus size={11} aria-hidden /> {label}
              </button>
            ))}
          </div>
        ) : null}
      </Field>

      {preview}

      <ToolsSection agent={agent} update={update} issues={issues} ui={ui("tools")} />
      <KnowledgeSection agent={agent} update={update} issues={issues} ui={ui("knowledge")} />
      <MemorySection agent={agent} update={update} onAssistant={() => setMemoryOpen(true)} ui={ui("memory")} />
      <OutputSection agent={agent} update={update} ui={ui("output")} />
      <ThinkingSection agent={agent} update={update} ui={ui("thinking")} />
      <QualitySection agent={agent} update={update} issues={issues} ui={ui("quality")} />
      <AdvancedSection agent={agent} update={update} modelOptions={modelOptions} ui={ui("advanced")} />

      {issues
        .filter((issue) => issue.level === "info")
        .map((issue) => (
          <p key={issue.message} className="field__hint">
            <ProblemText item={issue} compact />
          </p>
        ))}

      <DesignAgentDialog
        open={designOpen}
        onClose={() => setDesignOpen(false)}
        initial={agent.description}
        existing={existing}
        onApply={(config) => onReplace({ ...config, task_template: agent.task_template })}
      />
      <AgentTestDialog open={testOpen} onClose={() => setTestOpen(false)} agent={agent} defaultInput={testInput} />
      <MemoryAssistantDialog
        open={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        agent={agent}
        onSpace={(space) => update({ memory: { mode: "persistent", space } })}
      />
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const Icon = AGENT_ICONS[value] ?? AGENT_ICONS.bot;
  return (
    <div className="icon-picker">
      <button
        type="button"
        className="node-avatar node-avatar--lg"
        onClick={() => setOpen(!open)}
        aria-label={t("agent.chooseIcon")}
        aria-expanded={open}
      >
        <Icon size={18} aria-hidden />
      </button>
      {open ? (
        <div className="icon-picker__menu" role="listbox" aria-label={t("agent.icons")}>
          {Object.entries(AGENT_ICONS).map(([name, Item]) => (
            <button
              key={name}
              type="button"
              role="option"
              aria-selected={name === value}
              aria-label={t(`agent.iconNames.${name}`)}
              onClick={() => {
                onChange(name);
                setOpen(false);
              }}
            >
              <Item size={15} aria-hidden />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** What a section of the form needs to be opened from outside and to show its problems while closed. */
interface SectionUi {
  id: AgentSectionId;
  open: boolean | undefined;
  onToggle: (open: boolean) => void;
  status: SectionStatus;
}

interface SectionProps {
  agent: AgentConfig;
  update: (patch: Partial<AgentConfig>) => void;
  issues?: ConfigIssue[];
  ui: SectionUi;
}

/** Options only Anthropic offers: for another provider a note instead, unless a value is set (to reset it). */
function AnthropicOnly({ agent, set, children }: { agent: AgentConfig; set: boolean; children: ReactNode }) {
  const { t } = useTranslation();
  if (providerOf(agent.model) === "anthropic" || set) return <>{children}</>;
  return <p className="field__hint">{t("agent.anthropicOnly")}</p>;
}

function ToolsSection({ agent, update, issues = [], ui }: SectionProps) {
  const { t } = useTranslation();
  const tools = useTools();
  const meta = useMeta();
  const available = (tools.data ?? []).filter((tool) => !agent.tools.includes(tool.name));
  const count = agent.tools.length + agent.server_tools.length;
  return (
    <Section
      {...ui}
      title={t("agent.tools.title")}
      icon={Wrench}
      tip="agent.tools"
      summary={count ? t("agent.tools.assigned", { count }) : t("common.none")}
      defaultOpen={count > 0}
    >
      <div className="chip-row">
        {agent.tools.map((name) => (
          <Chip key={name} icon={Wrench} onRemove={() => update({ tools: agent.tools.filter((t) => t !== name) })}>
            {name}
          </Chip>
        ))}
        {!agent.tools.length ? <span className="muted small">{t("agent.tools.noneYet")}</span> : null}
      </div>
      <Select
        aria-label={t("agent.tools.add")}
        value=""
        placeholder={t("agent.tools.addPlaceholder")}
        options={available.map((tool) => ({
          value: tool.name,
          label: tool.name,
          hint: toolDescription(t, tool),
          group: t(`agent.tools.kind.${tool.kind}`),
        }))}
        onChange={(name) => name && update({ tools: [...agent.tools, name] })}
      />
      <p className="field__hint">
        <Trans i18nKey="agent.tools.missingHint" components={{ a: <Link to="/tools" /> }} />
      </p>
      <div className="stack-sm">
        <span className="field__label">
          <span className="nd-field-label">{t("agent.tools.serverTools")}</span>
          <HelpTip id="agent.serverTools" label={t("agent.tools.serverToolsShort")} />
        </span>
        <AnthropicOnly agent={agent} set={agent.server_tools.length > 0}>
          {(meta.data?.server_tools ?? []).map((tool) => (
            <Toggle
              key={tool.key}
              label={serverToolLabel(t, tool)}
              description={serverToolDescription(t, tool)}
              checked={agent.server_tools.includes(tool.key)}
              onChange={(on) =>
                update({
                  server_tools: on
                    ? [...agent.server_tools, tool.key]
                    : agent.server_tools.filter((key) => key !== tool.key),
                })
              }
            />
          ))}
        </AnthropicOnly>
      </div>
      <FieldErrors issues={issues} field="server_tools" />
      <FieldErrors issues={issues} field="tools" />
    </Section>
  );
}

function KnowledgeSection({ agent, update, issues = [], ui }: SectionProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const knowledge = useKnowledge();
  const files = knowledge.data ?? [];
  const assigned = files.filter((file) => agent.knowledge.file_ids.includes(file.id));
  const candidates = files.filter(
    (file) => !agent.knowledge.file_ids.includes(file.id) && file.name.toLowerCase().includes(query.toLowerCase()),
  );
  const setKnowledge = (patch: Partial<AgentConfig["knowledge"]>) => update({ knowledge: { ...agent.knowledge, ...patch } });
  // Upload from here (UX-K): the same endpoint as the Knowledge page. The file is stored in Knowledge at once; the
  // assignment is an ordinary, unsaved change of the agent, so undo and discard remove it and leave the file.
  const queryClient = useQueryClient();
  const picker = useRef<HTMLInputElement>(null);
  const current = useRef(agent.knowledge);
  current.current = agent.knowledge;
  const upload = useMutation({
    mutationFn: (list: File[]) => api.uploadKnowledge(list, ""),
    onSuccess: (added) => {
      // File ids are content hashes: uploading bytes that are already stored returns the existing file, so merge by id.
      queryClient.setQueryData<KnowledgeFile[]>(keys.knowledge(), (old) => [
        ...(old ?? []).filter((file) => !added.some((item) => item.id === file.id)),
        ...added,
      ]);
      void queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      void queryClient.invalidateQueries({ queryKey: ["knowledge-collections"] });
      const ids = added.map((file) => file.id).filter((id) => !current.current.file_ids.includes(id));
      update({ knowledge: { ...current.current, file_ids: [...current.current.file_ids, ...ids] } });
      toast.success(
        added.length === 1
          ? t("agent.knowledge.uploadedOne", { name: added[0].name })
          : t("agent.knowledge.uploaded", { count: added.length }),
      );
    },
    onError: toast.error,
  });
  const proposals: KnowledgeProposalConfig = agent.knowledge_proposals ?? { enabled: false, collection: "", content_kind: "generated" };
  const setProposals = (patch: Partial<KnowledgeProposalConfig>) => update({ knowledge_proposals: { ...proposals, ...patch } });
  return (
    <Section
      {...ui}
      title={t("agent.knowledge.title")}
      icon={BookOpen}
      tip="agent.knowledge"
      summary={knowledgeSummary(t, agent, assigned.length)}
      // From the configuration, not the loaded file list: the default applies once, when the section mounts.
      defaultOpen={agent.knowledge.file_ids.length > 0}
    >
      <div className="row-gap">
        <Segmented
          label={t("agent.knowledge.modeLabel")}
          value={agent.knowledge.mode}
          onChange={(mode) => setKnowledge({ mode })}
          options={[
            { value: "context", label: t("agent.knowledge.mode.context") },
            { value: "on_demand", label: t("agent.knowledge.mode.on_demand") },
            { value: "search", label: t("agent.knowledge.mode.search") },
          ]}
        />
        <HelpTip id="agent.knowledgeMode" label={t("agent.knowledge.modeShort")} />
      </div>
      <p className="field__hint">{t(`agent.knowledge.modeHint.${agent.knowledge.mode}`)}</p>
      <div className="chip-row">
        {assigned.map((file) => (
          <Chip
            key={file.id}
            icon={BookOpen}
            onRemove={() => setKnowledge({ file_ids: agent.knowledge.file_ids.filter((id) => id !== file.id) })}
          >
            {file.name}
          </Chip>
        ))}
      </div>
      <div className="knowledge-upload">
        <input
          ref={picker}
          type="file"
          multiple
          hidden
          accept={KNOWLEDGE_ACCEPT}
          data-testid="agent-knowledge-file"
          onChange={(event) => {
            const list = [...(event.target.files ?? [])];
            event.target.value = "";
            if (list.length) upload.mutate(list);
          }}
        />
        <Button size="sm" icon={Upload} busy={upload.isPending} onClick={() => picker.current?.click()}>
          {t("agent.knowledge.upload")}
        </Button>
        <span className="field__hint">{t("agent.knowledge.uploadHint")}</span>
      </div>
      {files.length ? (
        <>
          <TextInput
            placeholder={t("agent.knowledge.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("agent.knowledge.searchLabel")}
          />
          <ul className="pick-list">
            {candidates.slice(0, 6).map((file) => (
              <li key={file.id}>
                <button type="button" onClick={() => setKnowledge({ file_ids: [...agent.knowledge.file_ids, file.id] })}>
                  <Plus size={12} aria-hidden /> {file.name}
                  <small>{file.kind === "image" ? t("agent.knowledge.image") : t("agent.knowledge.chunks", { count: file.chunks })}</small>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : knowledge.isSuccess ? (
        // Only once the list has loaded: while it loads, "no files yet" would be a false empty state.
        <p className="field__hint">
          <Trans i18nKey="agent.knowledge.noFiles" components={{ a: <Link to="/knowledge" /> }} />
        </p>
      ) : null}
      <Toggle
        label={t("agent.knowledge.citations")}
        description={t("agent.knowledge.citationsHint")}
        tip="agent.citations"
        checked={agent.knowledge.citations}
        onChange={(citations) => setKnowledge({ citations })}
      />
      <Toggle
        label={t("inputs.proposals.toggle")}
        description={t("inputs.proposals.toggleHint")}
        tip="inputs.proposals"
        checked={proposals.enabled}
        onChange={(enabled) => setProposals({ enabled })}
      />
      {proposals.enabled ? (
        <div className="grid-2">
          <Field label={t("inputs.proposals.collection")}>
            <TextInput
              value={proposals.collection}
              maxLength={120}
              placeholder={t("inputs.adopt.newCollectionPlaceholder")}
              onChange={(e) => setProposals({ collection: e.target.value })}
            />
          </Field>
          <Field label={t("inputs.adopt.kind")}>
            <Select
              value={proposals.content_kind}
              onChange={(value) => setProposals({ content_kind: value as ContentKind })}
              options={(["extracted", "generated", "assumption"] as const).map((value) => ({
                value,
                label: t(`inputs.adopt.kinds.${value}`),
              }))}
            />
          </Field>
        </div>
      ) : null}
      <FieldErrors issues={issues} field="knowledge" />
    </Section>
  );
}

function MemorySection({ agent, update, onAssistant, ui }: SectionProps & { onAssistant: () => void }) {
  const { t } = useTranslation();
  const spaces = useMemorySpaces();
  const [newSpace, setNewSpace] = useState("");
  const setMemory = (patch: Partial<AgentConfig["memory"]>) => update({ memory: { ...agent.memory, ...patch } });
  const label =
    agent.memory.mode === "persistent" && agent.memory.space ? agent.memory.space : t(`agent.memory.summary.${agent.memory.mode}`);
  return (
    <Section {...ui} title={t("agent.memory.title")} icon={Brain} tip="agent.memory" summary={label} defaultOpen={agent.memory.mode !== "none"}>
      <Segmented
        label={t("agent.memory.modeLabel")}
        value={agent.memory.mode}
        onChange={(mode) => setMemory({ mode })}
        options={[
          { value: "none", label: t("agent.memory.mode.none") },
          { value: "run", label: t("agent.memory.mode.run") },
          { value: "persistent", label: t("agent.memory.mode.persistent") },
        ]}
      />
      <p className="field__hint">{t(`agent.memory.modeHint.${agent.memory.mode}`)}</p>
      {agent.memory.mode === "persistent" ? (
        <>
          <Field label={t("agent.memory.space")} tip="agent.memorySpace">
            <Select
              aria-label={t("agent.memory.space")}
              value={agent.memory.space ?? ""}
              placeholder={t("agent.memory.chooseSpace")}
              options={[
                ...(spaces.data ?? []).map((space) => ({
                  value: space.name,
                  label: t("agent.memory.spaceOption", { name: space.name, count: space.files }),
                })),
                ...(agent.memory.space && !(spaces.data ?? []).some((s) => s.name === agent.memory.space)
                  ? [{ value: agent.memory.space, label: t("agent.memory.spaceNew", { name: agent.memory.space }) }]
                  : []),
              ]}
              onChange={(space) => setMemory({ space: space || null })}
            />
          </Field>
          <div className="inline-form">
            <TextInput
              placeholder={t("agent.memory.newSpacePlaceholder")}
              value={newSpace}
              onChange={(e) => setNewSpace(e.target.value)}
              aria-label={t("agent.memory.newSpace")}
            />
            <Button
              size="sm"
              disabled={!newSpace.trim()}
              onClick={() => {
                setMemory({ space: newSpace.trim() });
                setNewSpace("");
              }}
            >
              {t("common.create")}
            </Button>
          </div>
          <div className="row-between">
            <Hint id="agent.memoryAssistant">
              <Button size="sm" icon={Sparkles} onClick={onAssistant}>
                {t("agent.memory.setUpWithAi")}
              </Button>
            </Hint>
            {agent.memory.space ? (
              <Link className="small" to={`/memory?space=${encodeURIComponent(agent.memory.space)}`}>
                {t("agent.memory.viewContent")}
              </Link>
            ) : null}
          </div>
        </>
      ) : null}
    </Section>
  );
}

function OutputSection({ agent, update, ui }: SectionProps) {
  const { t } = useTranslation();
  const output = agent.output;
  const setOutput = (patch: Partial<AgentConfig["output"]>) => update({ output: { ...output, ...patch } });
  return (
    <Section
      {...ui}
      title={t("agent.output.title")}
      icon={FileJson}
      tip="agent.output"
      summary={output.mode === "text" ? t("agent.output.summaryText") : t("agent.output.fields", { count: output.fields.length })}
    >
      <Segmented
        label={t("agent.output.title")}
        value={output.mode}
        onChange={(mode) =>
          setOutput({
            mode,
            fields: mode === "structured" && !output.fields.length
              ? [{ name: "summary", type: "string", description: t("agent.output.defaultFieldDescription"), required: true }]
              : output.fields,
          })
        }
        options={[
          { value: "text", label: t("agent.output.text") },
          { value: "structured", label: t("agent.output.structured") },
        ]}
      />
      {output.mode === "structured" ? (
        <>
          <p className="field__hint">{t("agent.output.structuredHint")}</p>
          <OutputFieldsEditor fields={output.fields} onChange={(fields) => setOutput({ fields })} idPrefix="output-field" />
        </>
      ) : null}
    </Section>
  );
}

function ThinkingSection({ agent, update, ui }: SectionProps) {
  const { t } = useTranslation();
  return (
    <Section
      {...ui}
      title={t("agent.thinking.title")}
      icon={Gauge}
      summary={thinkingSummary(t, agent)}
    >
      <Field label={t("agent.thinking.effort")} tip="agent.effort" hint={t("agent.thinking.effortHint")}>
        <Select
          aria-label={t("agent.thinking.effortShort")}
          value={agent.effort ?? ""}
          options={options(t, "effort", EFFORTS)}
          onChange={(value) => update({ effort: (value || null) as AgentConfig["effort"] })}
        />
      </Field>
      <Field label={t("agent.thinking.thinking")} tip="agent.thinking">
        <AnthropicOnly agent={agent} set={agent.thinking !== null}>
          <Select
            aria-label={t("agent.thinking.thinking")}
            value={agent.thinking ?? ""}
            options={options(t, "thinking", THINKING)}
            onChange={(value) => update({ thinking: (value || null) as AgentConfig["thinking"] })}
          />
        </AnthropicOnly>
      </Field>
      <Field label={t("agent.thinking.display")} tip="agent.thinkingDisplay" hint={t("agent.thinking.displayHint")}>
        <AnthropicOnly agent={agent} set={agent.thinking_display !== null}>
          <Select
            aria-label={t("agent.thinking.display")}
            value={agent.thinking_display ?? ""}
            options={options(t, "thinkingDisplay", THINKING_DISPLAY)}
            onChange={(value) => update({ thinking_display: (value || null) as AgentConfig["thinking_display"] })}
          />
        </AnthropicOnly>
      </Field>
    </Section>
  );
}

function QualitySection({ agent, update, issues = [], ui }: SectionProps) {
  const { t } = useTranslation();
  const quality = agent.quality;
  const setQuality = (patch: Partial<AgentConfig["quality"]>) => update({ quality: { ...quality, ...patch } });
  const judgeHint = useModelHint(quality.judge_model);
  const selfJudge = sameModel(quality.judge_model, agent.model);
  return (
    <Section
      {...ui}
      title={t("agent.quality.title")}
      icon={ShieldCheck}
      tip="agent.quality"
      summary={
        quality.enabled
          ? `${t("agent.quality.criteriaCount", { count: quality.criteria.length })} · ${t("agent.summary.judge", { model: splitModel(quality.judge_model).id })}`
          : t("agent.quality.off")
      }
    >
      <Toggle
        label={t("agent.quality.enable")}
        description={t("agent.quality.enableHint")}
        checked={quality.enabled}
        onChange={(enabled) => {
          // A check set up for the first time starts with the default model from the settings, so it adds no
          // provider the user did not choose. A configured check keeps its judge.
          const fresh = enabled && !quality.criteria.length;
          setQuality({
            enabled,
            criteria: fresh
              ? [{ name: "correct", description: t("agent.quality.defaultCriterion"), required: true }]
              : quality.criteria,
            judge_model: fresh ? getDefaultModel() : quality.judge_model,
          });
        }}
      />
      {quality.enabled ? (
        <>
          <span className="field__label">
            <span className="nd-field-label">{t("agent.quality.criteria")}</span>
            <HelpTip id="agent.qualityCriterion" label={t("agent.quality.criteria")} />
          </span>
          {quality.criteria.map((criterion, index) => (
            <div className="criterion" key={index}>
              <div className="inline-form">
                <TextInput
                  value={criterion.name}
                  aria-label={t("agent.quality.criterionName")}
                  onChange={(e) =>
                    setQuality({
                      criteria: quality.criteria.map((c, i) => (i === index ? { ...c, name: e.target.value } : c)),
                    })
                  }
                />
                <IconButton
                  icon={Trash2}
                  label={t("agent.quality.removeCriterion")}
                  onClick={() => setQuality({ criteria: quality.criteria.filter((_, i) => i !== index) })}
                />
              </div>
              <TextArea
                rows={2}
                value={criterion.description}
                aria-label={t("agent.quality.criterionDescription")}
                onChange={(e) =>
                  setQuality({
                    criteria: quality.criteria.map((c, i) => (i === index ? { ...c, description: e.target.value } : c)),
                  })
                }
              />
            </div>
          ))}
          <Button
            size="sm"
            icon={Plus}
            onClick={() =>
              setQuality({ criteria: [...quality.criteria, { name: `criterion_${quality.criteria.length + 1}`, description: "", required: true }] })
            }
          >
            {t("agent.quality.addCriterion")}
          </Button>
          <Field label={t("agent.quality.revisions")} tip="agent.qualityRevisions">
            <TextInput
              type="number"
              min={0}
              max={5}
              value={quality.max_revisions}
              onChange={(e) => setQuality({ max_revisions: Number(e.target.value) })}
            />
          </Field>
          <Field
            label={t("agent.quality.judgeModel")}
            tip="agent.judgeModel"
            hint={
              <>
                {judgeHint ? <>{judgeHint} </> : null}
                {t("agent.quality.judgeCost", { provider: providerLabel(t, providerOf(quality.judge_model)) })}
              </>
            }
          >
            <ModelPicker
              label={t("agent.quality.judgeModel")}
              value={quality.judge_model}
              onChange={(judge_model) => setQuality({ judge_model })}
            />
          </Field>
          {selfJudge ? (
            <Callout tone="warning">
              <span data-testid="self-judge">{t("agent.quality.selfJudge")}</span>
            </Callout>
          ) : null}
          <FieldErrors issues={issues} field="quality" />
        </>
      ) : null}
    </Section>
  );
}

function AdvancedSection({
  agent,
  update,
  modelOptions,
  ui,
}: SectionProps & { modelOptions: { value: string; label: string; group?: string }[] }) {
  const { t } = useTranslation();
  const [optionsText, setOptionsText] = useState(() => JSON.stringify(agent.request_options, null, 2));
  const [optionsError, setOptionsError] = useState<{ key: string; detail?: string } | null>(null);
  const tools = [...agent.tools, ...agent.server_tools, ...(agent.memory.mode !== "none" ? ["memory"] : [])];
  return (
    <Section {...ui} title={t("agent.advanced.title")} icon={SlidersHorizontal} summary={advancedSummary(t, agent)}>
      <div className="grid-2">
        <Field label={t("agent.advanced.maxTokens")} hint={t("agent.advanced.maxTokensHint")} tip="agent.maxTokens">
          <TextInput
            type="number"
            min={256}
            max={128000}
            step={256}
            value={agent.max_tokens}
            onChange={(e) => update({ max_tokens: Number(e.target.value) })}
          />
        </Field>
        <Field label={t("agent.advanced.maxToolRounds")} tip="agent.maxToolRounds">
          <TextInput
            type="number"
            min={0}
            max={50}
            value={agent.max_tool_rounds}
            onChange={(e) => update({ max_tool_rounds: Number(e.target.value) })}
          />
        </Field>
        <Field label={t("agent.advanced.parallelTools")} tip="agent.parallelTools">
          <TextInput
            type="number"
            min={1}
            max={16}
            value={agent.max_parallel_tools}
            onChange={(e) => update({ max_parallel_tools: Number(e.target.value) })}
          />
        </Field>
        <Field label={t("agent.advanced.toolChoice")} tip="agent.toolChoice">
          <Select
            aria-label={t("agent.advanced.toolChoice")}
            value={agent.tool_choice.type}
            options={options(t, "toolChoice", ["auto", "none", "any", "tool"])}
            onChange={(type) => update({ tool_choice: { type: type as AgentConfig["tool_choice"]["type"], name: agent.tool_choice.name } })}
          />
        </Field>
      </div>
      {agent.tool_choice.type === "tool" ? (
        <Field label={t("agent.advanced.forcedTool")}>
          <Select
            aria-label={t("agent.advanced.forcedTool")}
            value={agent.tool_choice.name ?? ""}
            placeholder={t("agent.advanced.chooseTool")}
            options={tools.map((name) => ({ value: name, label: name }))}
            onChange={(name) => update({ tool_choice: { type: "tool", name } })}
          />
        </Field>
      ) : null}
      <Toggle
        label={t("agent.advanced.toolErrors")}
        description={t("agent.advanced.toolErrorsHint")}
        tip="agent.toolErrors"
        checked={!agent.raise_tool_errors}
        onChange={(on) => update({ raise_tool_errors: !on })}
      />
      <AnthropicOnly agent={agent} set={!agent.cache_control || agent.cache_ttl !== "5m"}>
        <Toggle
          label={t("agent.advanced.caching")}
          description={t("agent.advanced.cachingHint")}
          tip="agent.caching"
          checked={agent.cache_control}
          onChange={(cache_control) => update({ cache_control })}
        />
      </AnthropicOnly>
      {agent.cache_control && (providerOf(agent.model) === "anthropic" || agent.cache_ttl !== "5m") ? (
        <div className="row-gap">
          <Segmented
            label={t("agent.advanced.cacheTtl")}
            value={agent.cache_ttl}
            onChange={(cache_ttl) => update({ cache_ttl })}
            options={[
              { value: "5m", label: t("agent.advanced.minutes", { count: 5 }) },
              { value: "1h", label: t("agent.advanced.hours", { count: 1 }) },
            ]}
          />
          <HelpTip id="agent.cacheTtl" label={t("agent.advanced.cacheTtl")} />
        </div>
      ) : null}
      <Field label={t("agent.advanced.refusal")} tip="agent.refusal">
        <Select
          aria-label={t("agent.advanced.refusalShort")}
          value={agent.on_refusal}
          options={options(t, "refusal", ["raise", "return"])}
          onChange={(value) => update({ on_refusal: value as AgentConfig["on_refusal"] })}
        />
      </Field>
      <Field label={t("agent.advanced.fallbacks")} tip="agent.fallbacks" hint={t("agent.advanced.fallbacksHint")}>
        <div className="chip-row">
          {agent.fallbacks.map((model) => (
            <Chip key={model} onRemove={() => update({ fallbacks: agent.fallbacks.filter((m) => m !== model) })}>
              {model}
            </Chip>
          ))}
        </div>
        <AnthropicOnly agent={agent} set={false}>
          <Select
            aria-label={t("agent.advanced.addFallback")}
            value=""
            placeholder={t("agent.advanced.addFallbackPlaceholder")}
            options={modelOptions.filter(
              (option) => !sameModel(option.value, agent.model) && !agent.fallbacks.some((model) => sameModel(model, option.value)),
            )}
            onChange={(model) => model && update({ fallbacks: [...agent.fallbacks, model] })}
          />
        </AnthropicOnly>
      </Field>
      <Field label={t("agent.advanced.examples")} tip="agent.examples" hint={t("agent.advanced.examplesHint")}>
        <div className="stack-sm">
          {agent.messages.map((message, index) => (
            <div key={index} className="example-message">
              <div className="row-between">
                <span className="small muted">{t(`agent.advanced.role.${message.role}`)}</span>
                <IconButton
                  icon={Trash2}
                  label={t("agent.advanced.removeMessage")}
                  onClick={() => update({ messages: agent.messages.filter((_, i) => i !== index) })}
                />
              </div>
              <TextArea
                rows={2}
                value={message.content}
                aria-label={t("agent.advanced.message", { number: index + 1 })}
                onChange={(e) =>
                  update({ messages: agent.messages.map((m, i) => (i === index ? { ...m, content: e.target.value } : m)) })
                }
              />
            </div>
          ))}
          <Button
            size="sm"
            icon={Plus}
            onClick={() =>
              update({
                messages: [
                  ...agent.messages,
                  { role: agent.messages.length % 2 === 0 ? "user" : "assistant", content: "" },
                ],
              })
            }
          >
            {agent.messages.length % 2 === 0 ? t("agent.advanced.addUserMessage") : t("agent.advanced.addAssistantMessage")}
          </Button>
        </div>
      </Field>
      <Field
        label={t("agent.advanced.requestOptions")}
        tip="agent.requestOptions"
        hint={t("agent.advanced.requestOptionsHint")}
      >
        <CodeEditor
          language="json"
          minHeight="80px"
          value={optionsText}
          ariaLabel={t("agent.advanced.requestOptions")}
          onChange={(text) => {
            setOptionsText(text);
            let parsed: unknown;
            try {
              parsed = text.trim() ? JSON.parse(text) : {};
            } catch (error) {
              setOptionsError({ key: "agent.advanced.invalidJson", detail: error instanceof Error ? error.message : String(error) });
              return;
            }
            if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
              setOptionsError({ key: "agent.advanced.objectExpected" });
              return;
            }
            setOptionsError(null);
            update({ request_options: parsed as Record<string, unknown> });
          }}
        />
        {optionsError ? (
          <Callout tone="danger">
            {t(optionsError.key)}
            {optionsError.detail ? (
              <details className="technical">
                <summary>{t("common.technicalDetails")}</summary>
                <code>{optionsError.detail}</code>
              </details>
            ) : null}
          </Callout>
        ) : null}
      </Field>
    </Section>
  );
}
