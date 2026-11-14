// Importing a skill (NAL-B3): the chosen ZIP or SKILL.md is checked first (dry run) and nothing is stored until the
// person has seen the validation report, the preview and the security note. A skill with the same name gets the file
// as its next version instead of a second skill.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { type Skill, type SkillCheck, skillKeys, skillsApi } from "../api/skills";
import { toast } from "../components/toast";
import { Badge, Button, Callout, Modal, Section, Spinner } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { formatBytes } from "../lib/format";
import { SkillIssues } from "./SkillIssues";

export function SkillImportDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: (skill: Skill) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const check = useMutation({ mutationFn: (chosen: File) => skillsApi.import(chosen, { dryRun: true }) });
  const report: SkillCheck | null = check.data?.check ?? null;
  const existing = report?.existing ?? null;
  const errors = report?.issues.filter((issue) => issue.severity === "error").length ?? 0;
  const warnings = (report?.issues.length ?? 0) - errors;

  const store = useMutation({
    mutationFn: () => skillsApi.import(file!, { skillId: existing?.id }),
    onSuccess: (result) => {
      const skill = result.skill!;
      toast.success(
        existing
          ? t("skills.importDialog.importedVersion", { name: skill.name, version: skill.version })
          : t("skills.importDialog.imported", { name: skill.name }),
      );
      void queryClient.invalidateQueries({ queryKey: skillKeys.all });
      onImported(skill);
      close();
    },
    onError: toast.error,
  });

  const choose = (chosen: File) => {
    setFile(chosen);
    check.mutate(chosen);
  };
  const close = () => {
    setFile(null);
    check.reset();
    store.reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      wide
      title={t("skills.importDialog.title")}
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" icon={Upload} disabled={!report || errors > 0} busy={store.isPending} onClick={() => store.mutate()}>
            {existing ? t("skills.importDialog.submitVersion", { name: existing.name }) : t("skills.importDialog.submit")}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Callout tone="warning">
          <strong className="row-gap">
            <ShieldAlert size={14} aria-hidden /> {t("skills.importDialog.securityTitle")}
          </strong>
          <p data-testid="skill-import-security">{t("skills.importDialog.security")}</p>
        </Callout>
        <div className="row-gap">
          <input
            ref={fileInput}
            type="file"
            accept=".zip,.md,application/zip,text/markdown"
            hidden
            data-testid="skill-import-file"
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              event.target.value = "";
              if (chosen) choose(chosen);
            }}
          />
          <Button icon={Upload} onClick={() => fileInput.current?.click()}>
            {t("skills.importDialog.choose")}
          </Button>
          {file ? <span className="muted small">{`${file.name} · ${formatBytes(file.size)}`}</span> : null}
        </div>
        <p className="muted small">{t("skills.importDialog.fileHint")}</p>
        {check.isPending ? <Spinner label={t("skills.importDialog.checking")} /> : null}
        {check.error ? (
          <Callout tone="danger">
            <ErrorText error={check.error} />
          </Callout>
        ) : null}
        {report ? (
          <>
            <section className="stack-sm" aria-label={t("skills.importDialog.report")} data-testid="skill-import-report">
              <h3>{t("skills.importDialog.report")}</h3>
              {errors ? (
                <Callout tone="danger">{t("skills.importDialog.errors", { count: errors })}</Callout>
              ) : (
                <p>{warnings ? t("skills.importDialog.warnings", { count: warnings }) : t("skills.importDialog.valid")}</p>
              )}
              <SkillIssues issues={report.issues} />
            </section>
            {existing ? (
              <Callout tone="info">
                <span data-testid="skill-import-existing">
                  {t("skills.importDialog.existing", { name: existing.name, version: existing.version })}
                </span>
              </Callout>
            ) : null}
            <SkillPreview check={report} />
          </>
        ) : null}
      </div>
    </Modal>
  );
}

/** What the import would store: the front matter, the instructions (as plain text, never as HTML) and the files. */
function SkillPreview({ check }: { check: SkillCheck }) {
  const { t } = useTranslation();
  return (
    <section className="stack-sm" aria-label={t("skills.importDialog.preview")}>
      <h3>{t("skills.importDialog.preview")}</h3>
      <dl className="skill-facts">
        <dt>{t("skills.fields.name")}</dt>
        <dd>{check.name || "—"}</dd>
        <dt>{t("skills.fields.description")}</dt>
        <dd>{check.description || "—"}</dd>
        {check.license ? (
          <>
            <dt>{t("skills.fields.license")}</dt>
            <dd>{check.license}</dd>
          </>
        ) : null}
        {check.compatibility ? (
          <>
            <dt>{t("skills.fields.compatibility")}</dt>
            <dd>{check.compatibility}</dd>
          </>
        ) : null}
        {check.allowed_tools ? (
          <>
            <dt>{t("skills.fields.allowedTools")}</dt>
            <dd>{check.allowed_tools}</dd>
          </>
        ) : null}
      </dl>
      <Section title={t("skills.body")} defaultOpen>
        <pre className="skill-body" data-testid="skill-import-body">
          {check.body || t("skills.emptyBody")}
        </pre>
      </Section>
      <Section title={t("skills.files")} summary={<span className="muted small">{t("skills.fileCount", { count: check.files.length })}</span>}>
        <ul className="stack-sm">
          {check.files.map((item) => (
            <li key={item.path} className="row-gap">
              <code>{item.path}</code>
              <span className="muted small">{formatBytes(item.size)}</span>
              {item.script ? <Badge tone="warning">{t("skills.fileScript")}</Badge> : null}
            </li>
          ))}
        </ul>
      </Section>
    </section>
  );
}
