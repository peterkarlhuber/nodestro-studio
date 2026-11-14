// Copying a skill under a new name: the way to rename one (a skill's name cannot change by editing).

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { type Skill, skillKeys, skillsApi } from "../api/skills";
import { toast } from "../components/toast";
import { Button, Field, Modal, TextInput } from "../components/ui";

export function SkillCopyDialog({ skill, onClose, onCopied }: { skill: Skill; onClose: () => void; onCopied: (copy: Skill) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(`${skill.name}-copy`);
  const copy = useMutation({
    mutationFn: () => skillsApi.copy(skill.id, name.trim()),
    onSuccess: (created) => {
      toast.success(t("skills.copyDialog.copied", { name: created.name }));
      void queryClient.invalidateQueries({ queryKey: skillKeys.all });
      onCopied(created);
      onClose();
    },
    onError: toast.error,
  });
  return (
    <Modal
      open
      title={t("skills.copyDialog.title", { name: skill.name })}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" icon={Copy} disabled={!name.trim()} busy={copy.isPending} onClick={() => copy.mutate()}>
            {t("skills.copy")}
          </Button>
        </>
      }
    >
      <Field label={t("skills.copyDialog.name")} hint={t("skills.copyDialog.nameHint")}>
        <TextInput value={name} onChange={(event) => setName(event.target.value)} autoFocus />
      </Field>
    </Modal>
  );
}
