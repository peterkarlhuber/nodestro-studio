// The skills of an agent (NAL-B3): each in one fixed version, loaded on demand or always. A newer version of a skill
// is offered, never used automatically. The runtime checks every rule (skill.* problems in the field "skills").
// NAL-B4: a group adds all its skills at once; above 20 on-demand skills each step offers only the best-fitting ones.

import { BookMarked, FolderPlus, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { isImported, useSkillGroups, useSkills, type Skill, type SkillBinding, type SkillGroup, type SkillMode } from "../api/skills";
import type { AgentConfig, ConfigIssue } from "../api/types";
import { Badge, Button, Callout, Chip, Section, type SectionStatus, Segmented, Select } from "../components/ui";
import { ProblemText } from "../lib/errors";
import type { AgentSectionId } from "./agentSummaries";

/** The most skills one agent may have (runtime ``MAX_AGENT_SKILLS``). */
export const MAX_AGENT_SKILLS = 100;
/** Above this many on-demand skills a step offers only a preselection (runtime, NAL-B4). */
export const PRESELECTION_THRESHOLD = 20;
/** How many on-demand skills the preselection offers, besides "always" and recommended ones. */
export const PRESELECTED_SKILLS = 8;

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

/**
 * The bindings with every active skill of the group added that is not assigned yet: each in its current version,
 * loaded on demand and labeled with the group. Stops at ``MAX_AGENT_SKILLS``.
 */
export function addGroup(skills: Skill[], bindings: SkillBinding[], group: SkillGroup): SkillBinding[] {
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const taken = new Set(bindings.map((binding) => binding.skill_id));
  const added: SkillBinding[] = [];
  for (const id of group.skill_ids) {
    const skill = byId.get(id);
    if (!skill || skill.status !== "active" || taken.has(id)) continue;
    if (bindings.length + added.length >= MAX_AGENT_SKILLS) break;
    taken.add(id);
    added.push({ skill_id: id, version: skill.version, mode: "on_demand", group_id: group.id });
  }
  return [...bindings, ...added];
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
  const groups = useSkillGroups();
  const groupById = new Map((groups.data ?? []).map((group) => [group.id, group]));
  // Groups with at least one skill that can still be added.
  const addableGroups = (groups.data ?? []).filter((group) => addGroup(skills.data ?? [], bindings, group).length > bindings.length);
  const onDemand = bindings.filter((binding) => binding.mode === "on_demand").length;
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
                  {binding.group_id && groupById.has(binding.group_id) ? (
                    <Badge>{t("agent.skills.group", { name: groupById.get(binding.group_id)!.name })}</Badge>
                  ) : null}
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
      {onDemand > PRESELECTION_THRESHOLD ? (
        <p className="field__hint" data-testid="skills-preselection">
          {t("agent.skills.preselection", { count: onDemand, best: PRESELECTED_SKILLS })}
        </p>
      ) : null}
      {bindings.length < MAX_AGENT_SKILLS ? (
        <>
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
          {addableGroups.length ? (
            <div className="row-gap">
              <FolderPlus size={14} aria-hidden />
              <Select
                aria-label={t("agent.skills.addGroup")}
                value=""
                placeholder={t("agent.skills.addGroupPlaceholder")}
                options={addableGroups.map((group) => ({
                  value: group.id,
                  label: t("agent.skills.groupOption", { name: group.name, count: group.skill_ids.length }),
                  hint: group.description,
                }))}
                onChange={(id) => {
                  const group = groupById.get(id);
                  if (group) set(addGroup(skills.data ?? [], bindings, group));
                }}
              />
            </div>
          ) : null}
        </>
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
