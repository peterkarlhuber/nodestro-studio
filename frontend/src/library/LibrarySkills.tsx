// The shipped skills of the library (NAL-B3): instructions in the Agent Skills format that an agent loads when its
// task needs them. Reading stores nothing; "Use as skill" stores the skill in the workspace (origin builtin:...),
// where it can be assigned to agents and changed like any other skill.

import { useMutation, useQuery } from "@tanstack/react-query";
import { BookMarked, Copy, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { skillsApi, useLibrarySkills, type LibrarySkill } from "../api/skills";
import { toast } from "../components/toast";
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  Modal,
  Spinner,
} from "../components/ui";
import { ErrorText } from "../lib/errors";

/** Skills whose name or description contains the search text (case-insensitive). */
export function filterSkills(
  skills: LibrarySkill[],
  query: string,
): LibrarySkill[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return skills;
  return skills.filter((skill) =>
    [skill.name, skill.description].some((text) =>
      text.toLowerCase().includes(needle),
    ),
  );
}

export function LibrarySkills({
  language,
  query,
  open,
  onOpen,
  onClose,
  onCopied,
}: {
  language: string;
  query: string;
  open: string | null;
  onOpen: (name: string) => void;
  onClose: () => void;
  onCopied: (skillId: string) => void;
}) {
  const { t } = useTranslation();
  const skills = useLibrarySkills(language);
  const shown = filterSkills(skills.data ?? [], query);
  return (
    <>
      <p className="muted small">{t("library.kinds.skillsIntro")}</p>
      {skills.isLoading ? <Spinner /> : null}
      {skills.error ? (
        <Callout tone="danger">
          <ErrorText error={skills.error} />
        </Callout>
      ) : null}
      {skills.data ? (
        <p className="muted small" aria-live="polite">
          {t("library.kinds.skillsResults", { count: shown.length })}
        </p>
      ) : null}
      {skills.data && !shown.length ? (
        <EmptyState icon={BookMarked} title={t("library.kinds.noMatch")} />
      ) : (
        <div className="card-grid" data-testid="library-skills">
          {shown.map((skill) => (
            <article
              className="card card--link example-card"
              key={skill.name}
              data-testid={`library-skill-${skill.family}`}
            >
              <button
                type="button"
                className="card__main example-card__main"
                onClick={() => onOpen(skill.name)}
              >
                <div className="card__head">
                  <span className="card__avatar">
                    <BookMarked size={16} aria-hidden />
                  </span>
                  <div>
                    <span className="example-card__field">{skill.name}</span>
                    <h2>{skill.family}</h2>
                  </div>
                </div>
                <p className="card__text">{skill.description}</p>
              </button>
              <footer className="card__foot example-card__foot">
                <span className="muted small">
                  {t("library.kinds.files", { count: skill.files.length })}
                </span>
                <Badge>{skill.language}</Badge>
              </footer>
            </article>
          ))}
        </div>
      )}
      {open ? (
        <SkillDialog
          key={open}
          name={open}
          onClose={onClose}
          onCopied={onCopied}
        />
      ) : null}
    </>
  );
}

function SkillDialog({
  name,
  onClose,
  onCopied,
}: {
  name: string;
  onClose: () => void;
  onCopied: (skillId: string) => void;
}) {
  const { t } = useTranslation();
  const detail = useQuery({
    queryKey: ["library-skill", name],
    queryFn: () => skillsApi.librarySkill(name),
  });
  const copy = useMutation({
    mutationFn: () => skillsApi.copyLibrary(name),
    onSuccess: (skill) => {
      toast.success(t("library.kinds.skillCopied", { name: skill.name }));
      onCopied(skill.id);
    },
    onError: toast.error,
  });
  const data = detail.data;
  return (
    <Modal
      open
      wide
      title={data?.name ?? name}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            icon={Copy}
            busy={copy.isPending}
            disabled={!data}
            onClick={() => copy.mutate()}
          >
            {t("library.kinds.useAsSkill")}
          </Button>
        </>
      }
    >
      {detail.isLoading ? <Spinner /> : null}
      {detail.error ? (
        <Callout tone="danger">
          <ErrorText error={detail.error} />
        </Callout>
      ) : null}
      {data ? (
        <div className="stack" data-testid="library-skill-detail">
          <p>{data.description}</p>
          <section className="stack-sm">
            <h3>{t("library.kinds.instructions")}</h3>
            {/* The instructions are shown as text, never rendered as HTML. */}
            <pre className="skill-body">{data.body}</pre>
          </section>
          <section className="stack-sm">
            <h3>{t("library.kinds.fileList")}</h3>
            <ul className="muted small">
              {data.files.map((file) => (
                <li key={file.path}>
                  <FileText size={12} aria-hidden /> {file.path}
                </li>
              ))}
            </ul>
          </section>
          <p className="muted small">
            {t("library.kinds.skillCopyNote", { version: data.version })}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
