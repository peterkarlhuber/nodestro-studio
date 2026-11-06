// The files of the next message in the assistant's composer: uploads in progress or refused, files waiting on the
// server (uploaded, not sent yet) and files of the conversation the user chose to send again.
//
// An upload is stored right away as a file of the conversation (the server checks and reads it), so a reload keeps
// the waiting files. Removing a waiting file deletes it; removing a reused file only takes it off the next message.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { AssistantFile, AssistantFileSupport, Conversation } from "../api/types";
import { type Coded, codedError } from "../lib/errors";
import { precheck } from "../lib/files";

export const supportKey = ["assistant", "file-support"] as const;

export function useFileSupport() {
  return useQuery({ queryKey: supportKey, queryFn: api.assistantFileSupport, staleTime: 60_000 });
}

/** A file being uploaded, or one the browser or the server refused (never stored). */
export interface LocalUpload {
  key: string;
  name: string;
  size: number;
  status: "uploading" | "error";
  /** The share (0…1) the browser has sent, in whole percent; undefined while unknown. 1: the server reads it. */
  progress?: number;
  problem?: Coded;
}

/** What the browser can tell before uploading: unsupported type, empty or too large (the server checks again). */
export function precheckFile(file: { name: string; size: number }, support: AssistantFileSupport | undefined): Coded | null {
  if (!support) return null;
  const result = precheck(file, { accept: [], max_size_mb: support.max_file_mb }, support.formats);
  return result.ok ? null : { code: result.code, params: result.params };
}

export function useComposerFiles(conversation: Conversation | undefined, ensure: () => Promise<string>) {
  const queryClient = useQueryClient();
  const support = useFileSupport();
  const [uploads, setUploads] = useState<LocalUpload[]>([]);
  const [reused, setReused] = useState<string[]>([]);
  const counter = useRef(0);
  const files = useMemo(() => conversation?.file_states ?? [], [conversation?.file_states]);

  /** Waiting files first (in upload order), then the reused ones. */
  const selected = useMemo<AssistantFile[]>(() => {
    const waiting = files.filter((item) => item.sent_at === null);
    const again = reused.map((id) => files.find((item) => item.id === id)).filter((item): item is AssistantFile => Boolean(item && item.sent_at));
    return [...waiting, ...again];
  }, [files, reused]);

  const limit = support.data?.max_files_per_message ?? 10;

  const store = useCallback(
    (updated: Conversation) => {
      queryClient.setQueryData(keys.conversation(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: keys.conversations });
    },
    [queryClient],
  );

  const add = useCallback(
    async (chosen: File[]) => {
      if (!chosen.length) return;
      const queue: { file: File; key: string }[] = [];
      const refused: LocalUpload[] = [];
      let free = limit - selected.length - uploads.filter((item) => item.status === "uploading").length;
      for (const file of chosen) {
        const key = `upload-${(counter.current += 1)}`;
        const problem: Coded | null =
          precheckFile(file, support.data) ?? (free <= 0 ? { code: "assistant.too_many_message_files", params: { limit } } : null);
        if (problem) {
          refused.push({ key, name: file.name, size: file.size, status: "error", problem });
          continue;
        }
        free -= 1;
        queue.push({ file, key });
      }
      setUploads((current) => [
        ...current,
        ...refused,
        ...queue.map((item) => ({ key: item.key, name: item.file.name, size: item.file.size, status: "uploading" as const })),
      ]);
      if (!queue.length) return;
      let id: string;
      try {
        id = await ensure();
      } catch (error) {
        const problem = codedError(error);
        const failed = new Set(queue.map((item) => item.key));
        setUploads((current) => current.map((entry) => (failed.has(entry.key) ? { ...entry, status: "error", problem } : entry)));
        return;
      }
      // One request per file, all at once: every file shows its own state and a slow one keeps no other waiting.
      await Promise.all(
        queue.map(async (item) => {
          try {
            const [result] = await api.uploadAssistantFile(id, item.file, (share) => {
              // Whole percent only: a large file reports progress many times a second.
              const progress = Math.floor(share * 100) / 100;
              setUploads((current) =>
                current.map((entry) => (entry.key === item.key && entry.progress !== progress ? { ...entry, progress } : entry)),
              );
            });
            if (result?.file) {
              setUploads((current) => current.filter((entry) => entry.key !== item.key));
            } else {
              const problem: Coded = result?.problem ?? { code: "input.damaged", params: { name: item.file.name } };
              setUploads((current) => current.map((entry) => (entry.key === item.key ? { ...entry, status: "error", problem } : entry)));
            }
          } catch (error) {
            const problem = codedError(error);
            setUploads((current) => current.map((entry) => (entry.key === item.key ? { ...entry, status: "error", problem } : entry)));
          } finally {
            await queryClient.invalidateQueries({ queryKey: keys.conversation(id) });
          }
        }),
      );
      void queryClient.invalidateQueries({ queryKey: keys.conversations });
    },
    [ensure, limit, queryClient, selected.length, support.data, uploads],
  );

  /** Take a file off the next message: a waiting file is deleted, a reused one only unselected. */
  const remove = useCallback(
    async (file: AssistantFile) => {
      if (file.sent_at !== null) {
        setReused((current) => current.filter((id) => id !== file.id));
        return;
      }
      if (!conversation) return;
      store(await api.removeAssistantFile(conversation.id, file.id));
    },
    [conversation, store],
  );

  const dismiss = useCallback((key: string) => setUploads((current) => current.filter((entry) => entry.key !== key)), []);

  const reuse = useCallback((file: AssistantFile) => setReused((current) => (current.includes(file.id) ? current : [...current, file.id])), []);

  /** After sending: the selected files count as sent at once (the server's answer follows). */
  const sent = useCallback(
    (conversationId: string, ids: string[]) => {
      setReused([]);
      setUploads((current) => current.filter((entry) => entry.status === "uploading"));
      const now = new Date().toISOString();
      queryClient.setQueryData<Conversation>(keys.conversation(conversationId), (current) =>
        current
          ? { ...current, file_states: current.file_states.map((item) => (ids.includes(item.id) ? { ...item, sent_at: now } : item)) }
          : current,
      );
    },
    [queryClient],
  );

  const reset = useCallback(() => {
    setReused([]);
    setUploads([]);
  }, []);

  return {
    support: support.data,
    files,
    selected,
    uploads,
    uploading: uploads.some((item) => item.status === "uploading"),
    limit,
    add,
    remove,
    dismiss,
    reuse,
    sent,
    reset,
    store,
  };
}

export type ComposerFiles = ReturnType<typeof useComposerFiles>;
