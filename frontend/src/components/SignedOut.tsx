// The window after the desktop sign-out (NS-002, NODESTRO_DESKTOP_LOGOUT): the studio is gone (no query runs on), and
// a short page says how to continue. Every request of this window would be refused now.

import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useSignedOut } from "../api/session";

export function SignedOutScreen() {
  const { t } = useTranslation();
  return (
    <main className="signed-out" data-testid="signed-out">
      <LogOut size={28} aria-hidden />
      <h1>{t("admin.desktop.signedOutTitle")}</h1>
      <p role="status">{t("admin.desktop.signedOutText")}</p>
    </main>
  );
}

/** The studio, or the signed-out page once this window signed out. */
export function SessionGate({ children }: { children: ReactNode }) {
  return useSignedOut() ? <SignedOutScreen /> : <>{children}</>;
}
