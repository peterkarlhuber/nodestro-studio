// The validation report of a skill: errors block an import or a save, warnings only inform.

import type { TFunction } from "i18next";
import { AlertTriangle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SkillIssue } from "../api/skills";
import i18n from "../i18n";
import { problemText } from "../lib/errors";

/** The issue in the interface language; a code without a text of its own shows the server's message. */
export function issueText(t: TFunction, issue: SkillIssue): string {
  const params = { path: issue.path ?? "", field: issue.field ?? "", ...issue.params };
  return i18n.exists(`errors.${issue.code}`, params) ? problemText(t, { code: issue.code, params }) : issue.message;
}

export function SkillIssues({ issues }: { issues: SkillIssue[] }) {
  const { t } = useTranslation();
  if (!issues.length) return null;
  // Errors first: they are what has to be fixed.
  const sorted = [...issues].sort((a, b) => Number(b.severity === "error") - Number(a.severity === "error"));
  return (
    <ul className="skill-issues" data-testid="skill-issues">
      {sorted.map((issue, index) => {
        const Icon = issue.severity === "error" ? XCircle : AlertTriangle;
        return (
          <li key={index} className={`skill-issues__item skill-issues__item--${issue.severity}`}>
            <Icon size={14} aria-hidden />
            <span>
              <span className="sr-only">{t(`skills.severity.${issue.severity}`)}: </span>
              {issueText(t, issue)}
              {issue.path ? <span className="muted small"> · {issue.path}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
