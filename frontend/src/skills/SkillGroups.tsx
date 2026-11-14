// Skill groups (NAL-B4): named sets of skills that are added to an agent in one step. A group is only a shortcut:
// every skill it adds is then assigned on its own, in its current version.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Layers, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAccess } from "../api/access";
import { type Skill, type SkillGroup, skillKeys, skillsApi, useSkillGroups } from "../api/skills";
import { toast } from "../components/toast";
import { Badge, Button, Callout, ConfirmIconButton, EmptyState, Field, Modal, Spinner, TextArea, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { changedText } from "../lib/format";
import { matchingSkills } from "./skillSearch";

export function SkillGroups({ skills, onSelect }: { skills: Skill[]; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const canEdit = useAccess().can("edit");
  const groups = useSkillGroups();
  // null: no dialog; "new": a new group; else the group being edited.
  const [editing, setEditing] = useState<SkillGroup | "new" | null>(null);
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const remove = useMutation({
    mutationFn: (group: SkillGroup) => skillsApi.removeGroup(group.id),
    onSuccess: (_, group) => {
      toast.success(t("skills.groups.deleted", { name: group.name }));
      void queryClient.invalidateQueries({ queryKey: skillKeys.groups });
    },
    onError: toast.error,
  });
  const newButton = canEdit ? (
    <Button icon={FolderPlus} onClick={() => setEditing("new")}>
      {t("skills.groups.new")}
    </Button>
  ) : null;
  const list = groups.data ?? [];

  return (
    <div className="stack" data-testid="skill-groups">
      <div className="row-between">
        <p className="muted small">{t("skills.groups.intro")}</p>
        {list.length ? newButton : null}
      </div>
      {groups.isLoading ? <Spinner /> : null}
      {groups.error ? (
        <Callout tone="danger">
          <ErrorText error={groups.error} />
        </Callout>
      ) : null}
      {groups.data && !list.length ? (
        <EmptyState icon={Layers} title={t("skills.groups.emptyTitle")} action={newButton}>
          {t("skills.groups.emptyText")}
        </EmptyState>
      ) : null}
      <div className="card-grid">
        {list.map((group) => (
          <article key={group.id} className="card" aria-label={t("skills.groups.group", { name: group.name })}>
            <div className="card__main stack-sm">
              <div className="row-between">
                <h3>{group.name}</h3>
                {canEdit ? (
                  <span className="row-gap">
                    <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(group)}>
                      {t("skills.groups.edit")}
                    </Button>
                    <ConfirmIconButton
                      icon={Trash2}
                      label={t("skills.groups.delete", { name: group.name })}
                      busy={remove.isPending}
                      onConfirm={() => remove.mutate(group)}
                    />
                  </span>
                ) : null}
              </div>
              <p className="card__text">{group.description || <span className="muted">{t("common.noDescription")}</span>}</p>
              <span className="muted small">{t("skills.groups.members", { count: group.skill_ids.length })}</span>
              <ul className="row-gap skill-group__members">
                {group.skill_ids.map((id) => {
                  const skill = byId.get(id);
                  return (
                    <li key={id}>
                      {skill ? (
                        <button type="button" className="link-button" onClick={() => onSelect(id)}>
                          {skill.name}
                        </button>
                      ) : (
                        <span className="muted">{t("skills.groups.missing")}</span>
                      )}
                      {skill && skill.status !== "active" ? <Badge tone="warning">{t(`skills.status.${skill.status}`)}</Badge> : null}
                    </li>
                  );
                })}
              </ul>
              <span className="muted small">{changedText(t, group.updated_at)}</span>
            </div>
          </article>
        ))}
      </div>
      {editing ? <SkillGroupDialog group={editing === "new" ? null : editing} skills={skills} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

/** Creating or editing a group: name, description and its skills, chosen from a filterable list. */
export function SkillGroupDialog({ group, skills, onClose }: { group: SkillGroup | null; skills: Skill[]; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [members, setMembers] = useState<string[]>(group?.skill_ids ?? []);
  const [query, setQuery] = useState("");
  const save = useMutation({
    mutationFn: () => {
      const body = { name: name.trim(), description: description.trim(), skill_ids: members };
      return group ? skillsApi.updateGroup(group.id, body) : skillsApi.createGroup(body);
    },
    onSuccess: (saved) => {
      toast.success(t("skills.groups.saved", { name: saved.name }));
      void queryClient.invalidateQueries({ queryKey: skillKeys.groups });
      onClose();
    },
  });
  const chosen = new Set(members);
  // Archived skills are offered only while they are still members, so they can be taken out.
  const offered = matchingSkills(
    skills.filter((skill) => skill.status !== "archived" || chosen.has(skill.id)),
    query,
  ).sort((a, b) => a.name.localeCompare(b.name));
  const toggle = (id: string, on: boolean) =>
    setMembers((current) => (on ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id)));

  return (
    <Modal
      open
      title={group ? t("skills.groups.editTitle", { name: group.name }) : t("skills.groups.newTitle")}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" icon={group ? Save : Plus} disabled={!name.trim()} busy={save.isPending} onClick={() => save.mutate()}>
            {group ? t("common.save") : t("skills.groups.create")}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label={t("skills.groups.name")}>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <Field label={t("skills.groups.description")}>
          <TextArea value={description} rows={2} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <fieldset className="stack-sm skill-group__picker">
          <legend className="nd-field-label">{t("skills.groups.chosen", { count: members.length })}</legend>
          <TextInput
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("skills.searchPlaceholder")}
            aria-label={t("skills.search")}
          />
          <div className="skill-group__options" data-testid="skill-group-options">
            {offered.map((skill) => (
              <label key={skill.id} className="checkbox">
                <input type="checkbox" checked={chosen.has(skill.id)} onChange={(event) => toggle(skill.id, event.target.checked)} />
                {skill.name}
                {skill.status !== "active" ? <span className="muted small"> · {t(`skills.status.${skill.status}`)}</span> : null}
              </label>
            ))}
            {!offered.length ? <p className="muted small">{t("skills.noMatch")}</p> : null}
          </div>
        </fieldset>
        {save.error ? (
          <Callout tone="danger">
            <ErrorText error={save.error} />
          </Callout>
        ) : null}
      </div>
    </Modal>
  );
}
