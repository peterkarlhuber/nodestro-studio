import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { create } from "zustand";

import i18n from "../i18n";
import { codedError, problemText, technicalText } from "../lib/errors";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  /** The technical original of an error, shown folded away. */
  detail?: string | null;
}

interface ToastState {
  toasts: Toast[];
  push: (tone: ToastTone, message: string, detail?: string | null) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (tone, message, detail) => {
    const id = ++counter;
    set({ toasts: [...get().toasts, { id, tone, message, detail }] });
    window.setTimeout(() => get().dismiss(id), tone === "error" ? 9000 : 4000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));

function showError(error: unknown, about?: string): void {
  const t = i18n.t.bind(i18n);
  const coded = codedError(error);
  const text = problemText(t, coded);
  useToasts.getState().push("error", about ? `${about}: ${text}` : text, technicalText(t, coded));
}

export const toast = {
  success: (message: string) => useToasts.getState().push("success", message),
  /** An error in the interface language (usable directly as a mutation's onError). */
  error: (error: unknown) => showError(error),
  /** An error about one item, e.g. a file: "name: sentence". */
  errorAbout: (name: string, error: unknown) => showError(error, name),
  info: (message: string) => useToasts.getState().push("info", message),
};

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export function Toaster() {
  const { t } = useTranslation();
  const { toasts, dismiss } = useToasts();
  return (
    <div className="toaster" aria-live="polite">
      {toasts.map((item) => {
        const Icon = ICONS[item.tone];
        return (
          <div key={item.id} className={`toast toast--${item.tone}`} role={item.tone === "error" ? "alert" : "status"}>
            <Icon size={16} aria-hidden />
            <span className="toast__text">
              {item.message}
              {item.detail ? (
                <details className="technical">
                  <summary>{t("common.technicalDetails")}</summary>
                  <code>{item.detail}</code>
                </details>
              ) : null}
            </span>
            <button type="button" onClick={() => dismiss(item.id)} aria-label={t("common.dismissMessage")}>
              <X size={14} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
