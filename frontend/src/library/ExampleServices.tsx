// The service connections an example's built-in tools need (NAL-B2: the web research example's `search`). The person
// picks one of their own connections or sets one up here; nothing is preselected (owner decision E-3 is open), and a
// copy without one still works: its workflow check names the missing connection until one is chosen in the agent.

import { Globe } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useConnectionStatus, useConnectionTypes, useConnections } from "../api/connections";
import type { ExampleDetail } from "../api/types";
import { Button, Field, Select } from "../components/ui";
import { SearchSetupDialog } from "../pages/SearchSetup";

export function ExampleServices({
  example,
  value,
  onChange,
}: {
  example: Pick<ExampleDetail, "services">;
  /** Kind -> connection id chosen here. */
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  const needed = example.services ?? [];
  const connections = useConnections(needed.length > 0);
  const types = useConnectionTypes();
  const status = useConnectionStatus();
  const [settingUp, setSettingUp] = useState<string | null>(null);
  if (!needed.length) return null;
  const searchType = (types.data ?? []).find((type) => type.name === "search");
  return (
    <section className="stack-sm" data-testid="example-services" aria-labelledby="example-services-title">
      <h3 id="example-services-title" className="example-preview__icon-title">
        <Globe size={14} aria-hidden /> {t("library.services.title")}
      </h3>
      <p className="muted small">{t("library.services.intro")}</p>
      {needed.map((kind) => {
        const typeLabel = t(`tools.connections.types.${kind}`, { defaultValue: kind });
        const options = (connections.data ?? []).filter((connection) => connection.type === kind);
        return (
          <div key={kind} className="stack-sm" data-testid={`example-service-${kind}`}>
            <Field
              label={t("library.services.choose", { type: typeLabel })}
              hint={connections.data && !options.length ? t("library.services.none", { type: typeLabel }) : t("library.services.later")}
            >
              <Select
                value={value[kind] ?? ""}
                placeholder={t("library.services.notNow")}
                options={options.map((connection) => ({ value: connection.id, label: connection.name }))}
                onChange={(id) => onChange({ ...value, [kind]: id })}
              />
            </Field>
            <div className="row-gap">
              {kind === "search" && searchType && status.data ? (
                <Button variant="ghost" onClick={() => setSettingUp(kind)}>
                  {t("library.services.setUpSearch")}
                </Button>
              ) : (
                <Link to="/tools?tab=connections">{t("library.services.setUp")}</Link>
              )}
            </div>
          </div>
        );
      })}
      {settingUp === "search" && searchType && status.data ? (
        <SearchSetupDialog
          type={searchType}
          status={status.data}
          onClose={() => setSettingUp(null)}
          onSaved={(saved) => {
            setSettingUp(null);
            onChange({ ...value, search: saved.id });
          }}
        />
      ) : null}
    </section>
  );
}
