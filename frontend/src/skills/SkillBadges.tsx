// The badges of a skill: status, version, where it comes from and whether it carries scripts (which are never run).

import { BookOpen, FileCode, FileInput, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { type Skill, type SkillStatus, isBuiltin, isImported } from "../api/skills";
import { Badge } from "../components/ui";
import type { Tone } from "../lib/format";

export type SkillOrigin = "user" | "import" | "builtin";

/** user (written or copied here), import (a file of unknown origin) or builtin (shipped with Nodestro). */
export function skillOrigin(origin: string): SkillOrigin {
  if (isBuiltin(origin)) return "builtin";
  if (isImported(origin)) return "import";
  return "user";
}

const STATUS_TONE: Record<SkillStatus, Tone> = { active: "success", disabled: "idle", archived: "warning" };
const ORIGIN_ICON = { user: User, import: FileInput, builtin: BookOpen };

export function SkillStatusBadge({ status }: { status: SkillStatus }) {
  const { t } = useTranslation();
  return <Badge tone={STATUS_TONE[status]}>{t(`skills.status.${status}`)}</Badge>;
}

export function SkillOriginBadge({ origin }: { origin: string }) {
  const { t } = useTranslation();
  const kind = skillOrigin(origin);
  return (
    <Badge tone={kind === "import" ? "warning" : "idle"} icon={ORIGIN_ICON[kind]}>
      {t(`skills.origin.${kind}`)}
    </Badge>
  );
}

export function SkillBadges({ skill }: { skill: Skill }) {
  const { t } = useTranslation();
  return (
    <span className="row-gap" data-testid="skill-badges">
      <SkillStatusBadge status={skill.status} />
      <Badge>{t("skills.version", { version: skill.version })}</Badge>
      <SkillOriginBadge origin={skill.origin} />
      {skill.has_scripts ? (
        <Badge tone="warning" icon={FileCode}>
          {t("skills.scripts")}
        </Badge>
      ) : null}
    </span>
  );
}
