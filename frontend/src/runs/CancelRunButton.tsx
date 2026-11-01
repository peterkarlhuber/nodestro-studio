// Stopping a run takes two clicks: "Cancel run", then "Really cancel?". Cancelling cannot be undone (a cancelled run
// can only be continued as a new run), and the plain word "Cancel" is what every dialog uses to close itself.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { api } from "../api/client";
import { keys } from "../api/hooks";
import { toast } from "../components/toast";
import { Button, Hint } from "../components/ui";

/** How long the second step waits for its click before the button returns to its first step. */
export const CONFIRM_MS = 5000;

export function CancelRunButton({ runId, size = "md" }: { runId: string; size?: "sm" | "md" }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [armed, setArmed] = useState(false);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const cancel = useMutation({
    mutationFn: () => api.cancelRun(runId),
    onSuccess: () => {
      toast.info(t("runs.cancelRun.done"));
      void queryClient.invalidateQueries({ queryKey: keys.run(runId) });
      void queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
    onError: (error) => toast.error(error),
  });
  useEffect(() => {
    if (!armed) return;
    confirmRef.current?.focus();
    const timer = window.setTimeout(() => setArmed(false), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);
  if (!armed)
    return (
      <Hint id="runs.cancel">
        <Button size={size} icon={Square} busy={cancel.isPending} disabled={cancel.isPending} onClick={() => setArmed(true)}>
          {t("runs.cancelRun.button")}
        </Button>
      </Hint>
    );
  return (
    <Button
      ref={confirmRef}
      size={size}
      variant="danger"
      icon={Square}
      onClick={() => {
        setArmed(false);
        cancel.mutate();
      }}
      onBlur={() => setArmed(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          setArmed(false);
        }
      }}
    >
      {t("runs.cancelRun.confirm")}
    </Button>
  );
}
