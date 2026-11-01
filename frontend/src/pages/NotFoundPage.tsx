import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/ui";
import { useDocumentTitle } from "../lib/documentTitle";

export function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("notFound.title"));
  return (
    <div className="page">
      <EmptyState level={1} icon={Compass} title={t("notFound.title")} action={<Link to="/">{t("notFound.action")}</Link>}>
        {t("notFound.text")}
      </EmptyState>
    </div>
  );
}
