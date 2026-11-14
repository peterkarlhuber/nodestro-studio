// The skills of an agent (NAL-B3): each in one fixed version, loaded on demand or always. A newer version of a skill
// is offered, never used automatically. The runtime checks every rule (skill.* problems in the field "skills").

import { BookMarked, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { isImported, useSkills, type Skill, type SkillBinding, type SkillMode } from "../api/skills";
import type { AgentConfig, ConfigIssue } from "../api/types";
import { Badge, Button, Callout, Chip, Section, type SectionStatus, Segmented, Select } from "../components/ui";
import { ProblemText } from "../lib/errors";
import type { AgentSectionId } from "./agentSummaries";

/** The most skills one agent may have (runtime ``MAX_AGENT_SKILLS``). */
export const MAX_AGENT_SKILLS = 20;

const MODES: SkillMode[] = ["on_demand", "always"];

/** The bindings with one changed; the others stay as they are. */
export function changeBinding(bindings: SkillBinding[], skillId: string, change: Partial<SkillBinding>): SkillBinding[] {
  return bindings.map((binding) => (binding.skill_id === skillId ? { ...binding, ...change } : binding));
}

/** The skills that can still be assigned: active, not assigned yet, sorted by name. */
export function assignable(skills: Skill[], bindings: SkillBinding[]): Skill[] {
  const taken = new Set(bindings.map((binding) => binding.skill_id));
  return skills.filter((skill) => skill.status === "active" && !taken.has(skill.id)).sort((a, b) => a.name.localeCompare(b.name));
}

export function SkillsSection({
  agent,
  update,
  issues = [],
  ui,
}: {
  agent: AgentConfig;
  update: (patch: Partial<AgentConfig>) => void;
  issues?: ConfigIssue[];
  ui: { id: AgentSectionId; open: boolean | undefined; onToggle: (open: boolean) => void; status: SectionStatus };
}) {
  const { t } = useTranslation();
  const skills = useSkills();
  const bindings = agent.skills ?? [];
  const byId = new Map((skills.data ?? []).map((skill) => [skill.id, skill]));
  const free = assignable(skills.data ?? [], bindings);
  const set = (next: SkillBinding[]) => update({ skills: next });
  const problems = issues.filter((issue) => issue.field === "skills" && issue.level !== "info");
  return (
    <Section
      {...ui}
      title={t("agent.skills.title")}
      icon={BookMarked}
      summary={bindings.length ? t("agent.skills.assigned", { count: bindings.length }) : t("common.none")}
      defaultOpen={bindings.length > 0}
    >
      <p className="field__hint">{t("agent.skills.intro")}</p>
      {bindings.length ? (
        <ul className="stack-sm" data-testid="agent-skills">
          {bindings.map((binding) => {
            const skill = byId.get(binding.skill_id);
            const newer = skill && skill.version > binding.version ? skill.version : null;
            return (
              <li key={binding.skill_id} className="stack-sm">
                <div className="row-gap">
                  <Chip icon={BookMarked} onRemove={() => set(bindings.filter((item) => item.skill_id !== binding.skill_id))}>
                    {skill?.name ?? binding.skill_id}
                  </Chip>
                  <span className="muted small">{t("agent.skills.version", { version: binding.version })}</span>
                  {skill && skill.status !== "active" ? <Badge tone="warning">{t(`agent.skills.status.${skill.status}`)}</Badge> : null}
                  {skill && isImported(skill.origin) ? <Badge tone="warning">{t("agent.skills.imported")}</Badge> : null}
                </div>
                <Segmented<SkillMode>
                  label={t("agent.skills.mode")}
                  value={binding.mode}
                  onChange={(mode) => set(changeBinding(bindings, binding.skill_id, { mode }))}
                  options={MODES.map((mode) => ({ value: mode, label: t(`agent.skills.modes.${mode}`) }))}
                />
                {newer ? (
                  <div className="row-gap">
                    <span className="muted small">{t("agent.skills.newer", { version: newer })}</span>
                    <Button size="sm" icon={RefreshCw} onClick={() => set(changeBinding(bindings, binding.skill_id, { version: newer }))}>
                      {t("agent.skills.useNewer", { version: newer })}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <span className="muted small">{t("agent.skills.noneYet")}</span>
      )}
      {bindings.length < MAX_AGENT_SKILLS ? (
        <Select
          aria-label={t("agent.skills.add")}
          value=""
          placeholder={t("agent.skills.addPlaceholder")}
          options={free.map((skill) => ({ value: skill.id, label: skill.name, hint: skill.description }))}
          onChange={(id) => {
            const skill = byId.get(id);
            if (skill) set([...bindings, { skill_id: skill.id, version: skill.version, mode: "on_demand" }]);
          }}
        />
      ) : (
        <p className="field__hint">{t("agent.skills.limit", { count: MAX_AGENT_SKILLS })}</p>
      )}
      <p className="field__hint">
        <Link to="/skills">{t("agent.skills.manage")}</Link> · <Link to="/workflows/examples?kind=skills">{t("agent.skills.library")}</Link>
      </p>
      {problems.map((issue) => (
        <Callout key={issue.message} tone={issue.level === "error" ? "danger" : "warning"}>
          <ProblemText item={issue} />
        </Callout>
      ))}
    </Section>
  );
}
