import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/ui";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="page">
      <EmptyState icon={Compass} title={t("notFound.title")} action={<Link to="/">{t("notFound.action")}</Link>}>
        {t("notFound.text")}
      </EmptyState>
    </div>
  );
}
