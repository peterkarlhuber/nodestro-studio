// Editing a skill's SKILL.md as text. Saving stores a new version with the new SKILL.md and every other file kept
// as it is; an unchanged text keeps the version.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { type SkillDetail, skillKeys, skillsApi } from "../api/skills";
import { toast } from "../components/toast";
import { Button, Callout, Field, Modal, Spinner, TextArea, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";

const SKILL_FILE = "SKILL.md";

export function SkillEditDialog({ detail, onClose }: { detail: SkillDetail; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { skill, version } = detail;
  const source = useQuery({
    queryKey: [...skillKeys.detail(skill.id, version.version), "file", SKILL_FILE],
    queryFn: () => skillsApi.file(skill.id, version.version, SKILL_FILE),
  });
  const [text, setText] = useState<string | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (source.data && text === null) setText(source.data.text);
  }, [source.data, text]);

  const save = useMutation({
    mutationFn: () =>
      skillsApi.update(
        skill.id,
        [{ path: SKILL_FILE, text: text ?? "" }, ...version.files.filter((item) => item.path !== SKILL_FILE).map((item) => ({ path: item.path, keep: true }))],
        note.trim(),
      ),
    onSuccess: (saved) => {
      toast.success(
        saved.version === skill.version
          ? t("skills.editDialog.unchanged", { version: saved.version })
          : t("skills.editDialog.saved", { version: saved.version }),
      );
      void queryClient.invalidateQueries({ queryKey: skillKeys.all });
      onClose();
    },
    onError: toast.error,
  });

  return (
    <Modal
      open
      wide
      title={t("skills.editDialog.title", { name: skill.name })}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" icon={Save} disabled={text === null || source.data?.truncated} busy={save.isPending} onClick={() => save.mutate()}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="muted small">{t("skills.editDialog.hint")}</p>
        {source.isLoading ? <Spinner /> : null}
        {source.error ? (
          <Callout tone="danger">
            <ErrorText error={source.error} />
          </Callout>
        ) : null}
        {source.data?.truncated ? <Callout tone="warning">{t("skills.editDialog.truncated")}</Callout> : null}
        {text !== null ? (
          <>
            <Field label={SKILL_FILE}>
              <TextArea value={text} rows={18} spellCheck={false} onChange={(event) => setText(event.target.value)} autoFocus />
            </Field>
            <Field label={t("skills.editDialog.note")}>
              <TextInput value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
