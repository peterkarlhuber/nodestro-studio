// The skills of the workspace (NAL-B3): instructions in the Agent Skills format that agents load in a fixed version.
// Skills are imported, edited and versioned here; they never grant tools and their scripts are never run.
// NAL-B4: skill groups and how often skills were used.

import { BarChart3, Layers, Puzzle, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { useAccess } from "../api/access";
import { useSkills } from "../api/skills";
import { Button, Callout, EmptyState, PageHeader, Segmented, Spinner, TextInput } from "../components/ui";
import { ErrorText } from "../lib/errors";
import { changedText } from "../lib/format";
import { SkillBadges } from "../skills/SkillBadges";
import { SkillDetail } from "../skills/SkillDetail";
import { SkillGroups } from "../skills/SkillGroups";
import { SkillImportDialog } from "../skills/SkillImportDialog";
import { matchingSkills } from "../skills/skillSearch";
import { SkillStatsView } from "../skills/SkillStatsView";

export { matchingSkills };

type View = "skills" | "groups" | "usage";

export function SkillsPage() {
  const { t } = useTranslation();
  const skills = useSkills();
  const canEdit = useAccess().can("edit");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [view, setView] = useState<View>("skills");
  // ?skill=<id> (e.g. after copying a skill from the library) opens that skill.
  const [params, setParams] = useSearchParams();
  const wanted = params.get("skill");
  useEffect(() => {
    if (!wanted) return;
    setSelectedId(wanted);
    setQuery("");
    setParams({}, { replace: true });
  }, [wanted, setParams]);

  const all = skills.data ?? [];
  const shown = matchingSkills(all, query);
  const importButton = canEdit ? (
    <Button variant="primary" icon={Upload} onClick={() => setImportOpen(true)}>
      {t("skills.import")}
    </Button>
  ) : null;

  return (
    <div className="page page--split">
      <div className="page__main">
        <PageHeader title={t("nav.skills")} doc="skills" description={t("skills.description")} actions={importButton} />
        <div className="page__body">
          {skills.isLoading ? <Spinner /> : null}
          {skills.error ? (
            <Callout tone="danger">
              <ErrorText error={skills.error} />
            </Callout>
          ) : null}
          {skills.data && !all.length ? (
            <EmptyState icon={Puzzle} title={t("skills.emptyTitle")} action={importButton}>
              {t("skills.emptyText")}
            </EmptyState>
          ) : null}
          {all.length ? (
            <Segmented<View>
              label={t("skills.views.label")}
              value={view}
              onChange={setView}
              options={[
                { value: "skills", label: t("skills.views.skills"), icon: Puzzle },
                { value: "groups", label: t("skills.views.groups"), icon: Layers },
                { value: "usage", label: t("skills.views.usage"), icon: BarChart3 },
              ]}
            />
          ) : null}
          {view === "groups" && all.length ? <SkillGroups skills={all} onSelect={setSelectedId} /> : null}
          {view === "usage" && all.length ? (
            <SkillStatsView onSelect={(name) => setSelectedId(all.find((skill) => skill.name === name)?.id ?? null)} />
          ) : null}
          {view === "skills" && all.length ? (
            <div className="page__filters skills__filters" role="search">
              <TextInput
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("skills.searchPlaceholder")}
                aria-label={t("skills.search")}
              />
            </div>
          ) : null}
          {view === "skills" && all.length && !shown.length ? <p className="muted">{t("skills.noMatch")}</p> : null}
          {view === "skills" ? (
            <div className="card-grid">
              {shown.map((skill) => (
                <article key={skill.id} className={`card ${skill.id === selectedId ? "card--selected" : ""}`}>
                  <button
                    type="button"
                    className="card__main card--button"
                    onClick={() => setSelectedId(skill.id)}
                    aria-pressed={skill.id === selectedId}
                  >
                    <div className="card__head">
                      <span className="card__avatar">
                        <Puzzle size={16} aria-hidden />
                      </span>
                      <h3>{skill.name}</h3>
                    </div>
                    <p className="card__text">{skill.description || <span className="muted">{t("common.noDescription")}</span>}</p>
                    <SkillBadges skill={skill} />
                    <span className="muted small">{changedText(t, skill.updated_at)}</span>
                  </button>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <aside className="inspector" aria-label={t("skills.detailTitle")}>
        <div className="inspector__body">
          <div className="inspector__content">
            {selectedId ? (
              <SkillDetail key={selectedId} skillId={selectedId} onSelect={setSelectedId} onDeleted={() => setSelectedId(null)} />
            ) : (
              <>
                <h2 className="inspector__heading">{t("skills.detailTitle")}</h2>
                <p className="muted small">{t("skills.selectHint")}</p>
              </>
            )}
          </div>
        </div>
      </aside>
      <SkillImportDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={(skill) => setSelectedId(skill.id)} />
    </div>
  );
}
