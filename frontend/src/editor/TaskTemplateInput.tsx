// The agent's task field. A new agent's task is only the input placeholder; instead of the raw `{{input}}` it shows
// as a chip that says what the agent gets, with a switch to the text (ED-22). Any other task is plain text.

import { ArrowDownToLine, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, TextArea } from "../components/ui";

export const INPUT_ONLY = "{{input}}";

export function TaskTemplateInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const placeholderOnly = value.trim() === INPUT_ONLY;
  const [raw, setRaw] = useState(!placeholderOnly);
  const text = useRef<HTMLTextAreaElement>(null);
  const focusText = useRef(false);
  useEffect(() => {
    if (raw && focusText.current) {
      focusText.current = false;
      text.current?.focus();
    }
  }, [raw]);
  if (placeholderOnly && !raw)
    return (
      <div className="task-chip" data-testid="task-chip">
        <span className="chip" title={INPUT_ONLY}>
          <ArrowDownToLine size={11} aria-hidden /> {t("agent.taskChip.label")}
        </span>
        <span className="muted small">{t("agent.taskChip.text")}</span>
        <Button
          id={id}
          size="sm"
          variant="ghost"
          icon={Pencil}
          onClick={() => {
            focusText.current = true;
            setRaw(true);
          }}
        >
          {t("agent.taskChip.edit")}
        </Button>
      </div>
    );
  return (
    <>
      <TextArea ref={text} id={id} rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
      {placeholderOnly ? (
        <Button size="sm" variant="ghost" onClick={() => setRaw(false)}>
          {t("agent.taskChip.asChip")}
        </Button>
      ) : null}
    </>
  );
}
