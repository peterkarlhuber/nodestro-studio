// One skill in the side panel of the Skills page: front matter, instructions, files, versions, where it is used and
// what can be done with it. Older versions can be looked at; only the current one is edited. The instructions are
// shown as plain text and never rendered as HTML (an imported skill is content of unknown origin).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Copy, Download, Eye, FileText, History, Pencil, Power, PowerOff, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAccess } from "../api/access";
import { ApiError } from "../api/client";
import {
  type Skill,
  type SkillFileInfo,
  type SkillUser,
  skillKeys,
  skillsApi,
  useSkill,
  useSkillUsage,
  useSkillVersions,
} from "../api/skills";
import { PermissionNote } from "../components/Access";
import { toast } from "../components/toast";
import { Badge, Button, Callout, ConfirmIconButton, IconButton, Modal, Section, Spinner } from "../components/ui";
import { ErrorText, problemText } from "../lib/errors";
import { formatBytes, formatDate } from "../lib/format";
import { SkillBadges } from "./SkillBadges";
import { SkillCopyDialog } from "./SkillCopyDialog";
import { SkillEditDialog } from "./SkillEditDialog";
import { SkillIssues } from "./SkillIssues";

export function SkillDetail({ skillId, onSelect, onDeleted }: { skillId: string; onSelect: (id: string) => void; onDeleted: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const access = useAccess();
  const canEdit = access.can("edit");
  const admin = access.can("admin");
  // undefined: the current version.
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [dialog, setDialog] = useState<"edit" | "copy" | null>(null);
  // Set when deleting was refused because agents still use the skill.
  const [inUse, setInUse] = useState<ApiError | null>(null);
  const detail = useSkill(skillId, version);

  const refresh = () => queryClient.invalidateQueries({ queryKey: skillKeys.all });
  const status = useMutation({
    mutationFn: (next: "active" | "disabled") => skillsApi.setStatus(skillId, next),
    onSuccess: (skill) => {
      toast.success(t(skill.status === "active" ? "skills.activated" : "skills.disabled", { name: skill.name }));
      void refresh();
    },
    onError: toast.error,
  });
  const archive = useMutation({
    mutationFn: () => skillsApi.archive(skillId),
    onSuccess: (skill) => {
      setInUse(null);
      toast.success(t("skills.archived", { name: skill.name }));
      void refresh();
    },
    onError: toast.error,
  });
  const remove = useMutation({
    mutationFn: () => skillsApi.remove(skillId),
    onSuccess: () => {
      toast.success(t("skills.deleted"));
      void refresh();
      onDeleted();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "skill.in_use") setInUse(error);
      else toast.error(error);
    },
  });

  if (detail.isLoading) return <Spinner />;
  if (detail.error)
    return (
      <Callout tone="danger">
        <ErrorText error={detail.error} />
      </Callout>
    );
  if (!detail.data) return null;
  const { skill, version: shown, body } = detail.data;
  const older = shown.version !== skill.version;

  return (
    <div className="stack" data-testid="skill-detail">
      <div className="stack-sm">
        <h2 className="inspector__heading">{skill.name}</h2>
        <SkillBadges skill={skill} />
      </div>
      {older ? (
        <Callout tone="info">
          <span className="row-gap">
            {t("skills.viewing", { version: shown.version, latest: skill.version })}
            <Button size="sm" variant="ghost" onClick={() => setVersion(undefined)}>
              {t("skills.showLatest")}
            </Button>
          </span>
        </Callout>
      ) : null}
      <div className="row-gap" role="group" aria-label={t("skills.actions")}>
        {canEdit && !older ? (
          <Button size="sm" icon={Pencil} onClick={() => setDialog("edit")}>
            {t("skills.edit")}
          </Button>
        ) : null}
        {canEdit ? (
          <Button size="sm" icon={Copy} onClick={() => setDialog("copy")}>
            {t("skills.copy")}
          </Button>
        ) : null}
        {canEdit ? (
          skill.status === "active" ? (
            <Button size="sm" icon={PowerOff} busy={status.isPending} onClick={() => status.mutate("disabled")}>
              {t("skills.disable")}
            </Button>
          ) : (
            <Button size="sm" icon={Power} busy={status.isPending} onClick={() => status.mutate("active")}>
              {t("skills.activate")}
            </Button>
          )
        ) : null}
        {admin && skill.status !== "archived" ? (
          <Button size="sm" icon={Archive} busy={archive.isPending} onClick={() => archive.mutate()}>
            {t("skills.archive")}
          </Button>
        ) : null}
        <a className="nd-button nd-button--default nd-button--sm" href={skillsApi.exportUrl(skill.id, shown.version)} download={`${skill.name}.zip`}>
          <Download size={15} aria-hidden />
          {t("skills.export")}
        </a>
        {admin ? <ConfirmIconButton icon={Trash2} label={t("skills.delete")} busy={remove.isPending} onConfirm={() => remove.mutate()} /> : null}
      </div>
      <PermissionNote permission="edit" access={access} />
      {inUse ? (
        <Callout tone="warning">
          <span className="row-gap" data-testid="skill-in-use">
            {problemText(t, { code: "skill.in_use", params: inUse.params })}
            {admin && skill.status !== "archived" ? (
              <Button size="sm" icon={Archive} busy={archive.isPending} onClick={() => archive.mutate()}>
                {t("skills.archive")}
              </Button>
            ) : null}
          </span>
        </Callout>
      ) : null}
      <SkillIssues issues={detail.data.issues} />

      <Section id="skill-front-matter" title={t("skills.frontMatter")} defaultOpen>
        <dl className="skill-facts">
          <dt>{t("skills.fields.description")}</dt>
          <dd>{shown.description || "—"}</dd>
          {shown.license ? (
            <>
              <dt>{t("skills.fields.license")}</dt>
              <dd>{shown.license}</dd>
            </>
          ) : null}
          {shown.compatibility ? (
            <>
              <dt>{t("skills.fields.compatibility")}</dt>
              <dd>{shown.compatibility}</dd>
            </>
          ) : null}
          {shown.allowed_tools ? (
            <>
              <dt>{t("skills.fields.allowedTools")}</dt>
              <dd>{shown.allowed_tools}</dd>
            </>
          ) : null}
          {Object.entries(shown.metadata).map(([key, value]) => (
            <FactRow key={key} label={key} value={value} />
          ))}
          <dt>{t("skills.fields.created")}</dt>
          <dd>{formatDate(shown.created_at)}</dd>
        </dl>
      </Section>
      <Section id="skill-body" title={t("skills.body")} icon={FileText} defaultOpen>
        <pre className="skill-body" data-testid="skill-body">
          {body || t("skills.emptyBody")}
        </pre>
      </Section>
      <SkillFiles skillId={skill.id} version={shown.version} files={detail.data.files} />
      <SkillVersions skill={skill} shown={shown.version} onShow={(item) => setVersion(item === skill.version ? undefined : item)} />
      <SkillUsage skillId={skill.id} />

      {dialog === "edit" ? <SkillEditDialog detail={detail.data} onClose={() => setDialog(null)} /> : null}
      {dialog === "copy" ? <SkillCopyDialog skill={skill} onClose={() => setDialog(null)} onCopied={(copy) => onSelect(copy.id)} /> : null}
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function SkillFiles({ skillId, version, files }: { skillId: string; version: number; files: SkillFileInfo[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Section id="skill-files" title={t("skills.files")} summary={<span className="muted small">{t("skills.fileCount", { count: files.length })}</span>}>
      <ul className="stack-sm">
        {files.map((item) => (
          <li key={item.path} className="row-gap">
            <code>{item.path}</code>
            <span className="muted small">{formatBytes(item.size)}</span>
            {item.script ? <Badge tone="warning">{t("skills.fileScript")}</Badge> : null}
            {item.text ? (
              <IconButton icon={Eye} label={t("skills.showFile", { path: item.path })} onClick={() => setOpen(item.path)} />
            ) : (
              <span className="muted small">{t("skills.fileNotText")}</span>
            )}
          </li>
        ))}
      </ul>
      {open ? <FilePreview skillId={skillId} version={version} path={open} onClose={() => setOpen(null)} /> : null}
    </Section>
  );
}

function FilePreview({ skillId, version, path, onClose }: { skillId: string; version: number; path: string; onClose: () => void }) {
  const { t } = useTranslation();
  const file = useQuery({
    queryKey: [...skillKeys.detail(skillId, version), "file", path],
    queryFn: () => skillsApi.file(skillId, version, path),
  });
  return (
    <Modal open wide title={path} onClose={onClose}>
      {file.isLoading ? <Spinner /> : null}
      {file.error ? (
        <Callout tone="danger">
          <ErrorText error={file.error} />
        </Callout>
      ) : null}
      {file.data ? (
        <div className="stack-sm">
          {file.data.truncated ? <Callout tone="info">{t("skills.truncated")}</Callout> : null}
          <pre className="skill-body" data-testid="skill-file-text">
            {file.data.text}
          </pre>
        </div>
      ) : null}
    </Modal>
  );
}

function SkillVersions({ skill, shown, onShow }: { skill: Skill; shown: number; onShow: (version: number) => void }) {
  const { t } = useTranslation();
  const versions = useSkillVersions(skill.id);
  return (
    <Section
      id="skill-versions"
      title={t("skills.versions")}
      icon={History}
      summary={<span className="muted small">{t("skills.version", { version: skill.version })}</span>}
    >
      {versions.isLoading ? <Spinner /> : null}
      {versions.error ? (
        <Callout tone="danger">
          <ErrorText error={versions.error} />
        </Callout>
      ) : null}
      <ol className="stack-sm">
        {[...(versions.data ?? [])]
          .sort((a, b) => b.version - a.version)
          .map((item) => (
            <li key={item.version} className="row-gap" data-testid={`skill-version-${item.version}`}>
              <span>
                <strong>{t("skills.version", { version: item.version })}</strong>{" "}
                <span className="muted small">
                  {formatDate(item.created_at)}
                  {item.note ? ` · ${item.note}` : ""}
                </span>
              </span>
              {item.version === skill.version ? <Badge tone="success">{t("skills.current")}</Badge> : null}
              {item.version !== shown ? (
                <Button size="sm" variant="ghost" onClick={() => onShow(item.version)}>
                  {t("skills.show")}
                </Button>
              ) : null}
            </li>
          ))}
      </ol>
    </Section>
  );
}

/** Where a user of the skill is edited: a workflow in the editor, an agent template in the agent library. */
function userLink(user: SkillUser): string {
  return user.kind === "template" ? `/agents?template=${encodeURIComponent(user.id)}` : `/workflows/${encodeURIComponent(user.id)}`;
}

function SkillUsage({ skillId }: { skillId: string }) {
  const { t } = useTranslation();
  const usage = useSkillUsage(skillId);
  const users = usage.data ?? [];
  return (
    <Section
      id="skill-usage"
      title={t("skills.usage")}
      icon={Users}
      summary={usage.data ? <span className="muted small">{users.length}</span> : null}
    >
      {usage.isLoading ? <Spinner /> : null}
      {usage.error ? (
        <Callout tone="danger">
          <ErrorText error={usage.error} />
        </Callout>
      ) : null}
      {usage.data && !users.length ? <p className="muted small">{t("skills.usageNone")}</p> : null}
      <ul className="stack-sm" data-testid="skill-usage">
        {users.map((user) => (
          <li key={`${user.kind}-${user.id}-${user.agent}`}>
            <Link to={userLink(user)}>{user.name}</Link>{" "}
            <span className="muted small">
              {t("skills.usageItem", {
                kind: t(`skills.usageKind.${user.kind}`, { defaultValue: user.kind }),
                agent: user.agent,
                version: user.version,
              })}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
