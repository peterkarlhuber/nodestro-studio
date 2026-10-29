import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { AgentConfig, MemorySeed } from "../api/types";
import { toast } from "../components/toast";
import { Button, Callout, Field, Modal, TextArea, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";

/** A background assistant proposes a memory structure; the user reviews and saves it. */
export function MemoryAssistantDialog({
  open,
  onClose,
  agent,
  onSpace,
}: {
  open: boolean;
  onClose: () => void;
  agent: AgentConfig;
  onSpace: (space: string) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [wishes, setWishes] = useState("");
  const [space, setSpace] = useState(agent.memory.space ?? agent.name);
  const [seed, setSeed] = useState<MemorySeed | null>(null);
  const propose = useMutation({
    mutationFn: () => api.proposeMemory(`${agent.name}: ${agent.description}\n\n${agent.system_prompt}`, wishes),
    onSuccess: (result) => setSeed(result.seed),
  });
  const save = useMutation({
    mutationFn: async () => {
      for (const file of seed?.files ?? []) await api.writeMemory(space.trim(), file.path, file.content);
    },
    onSuccess: () => {
      onSpace(space.trim());
      void queryClient.invalidateQueries({ queryKey: keys.memorySpaces });
      toast.success(t("editor.memoryAssistant.saved", { name: space.trim() }));
      onClose();
    },
    onError: toast.error,
  });
  return (
    <Modal
      title={t("editor.memoryAssistant.title")}
      open={open}
      onClose={onClose}
      wide
      footer={
        seed ? (
          <>
            <Button variant="ghost" onClick={() => setSeed(null)}>
              {t("common.back")}
            </Button>
            <Button variant="primary" busy={save.isPending} disabled={!space.trim()} onClick={() => save.mutate()}>
              {t("editor.memoryAssistant.save")}
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            icon={Sparkles}
            busy={propose.isPending}
            disabled={!wishes.trim()}
            onClick={() => propose.mutate()}
          >
            {t("editor.design.propose")}
          </Button>
        )
      }
    >
      {!seed ? (
        <>
          <Field label={t("editor.memoryAssistant.question")} hint={t("editor.memoryAssistant.hint")}>
            <TextArea
              rows={5}
              value={wishes}
              autoFocus
              placeholder={t("editor.memoryAssistant.placeholder")}
              onChange={(e) => setWishes(e.target.value)}
            />
          </Field>
          {propose.error ? (
            <Callout tone="danger">
              <ErrorText error={propose.error} />
            </Callout>
          ) : null}
        </>
      ) : (
        <>
          <Callout tone="brand">{seed.explanation}</Callout>
          <Field label={t("agent.memory.space")}>
            <TextInput value={space} onChange={(e) => setSpace(e.target.value)} />
          </Field>
          {seed.files.map((file, index) => (
            <Field key={index} label={<code>{file.path}</code>}>
              <TextArea
                rows={5}
                value={file.content}
                onChange={(e) =>
                  setSeed({
                    ...seed,
                    files: seed.files.map((f, i) => (i === index ? { ...f, content: e.target.value } : f)),
                  })
                }
              />
            </Field>
          ))}
        </>
      )}
    </Modal>
  );
}
