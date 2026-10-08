import type { ChecklistItem } from "@a11y/content";
import { categories, categoryTranslations, eaaRegulationUrl, en301549ContextUrl, localizeChecklistItem, wcagCriteria, wcagUnderstandingUrl } from "@a11y/content";
import { useProgress } from "../progress";
import { usePreferences } from "../preferences";

export function ChecklistCard({ item, compact = false, targetLevel }: { item: ChecklistItem; compact?: boolean; targetLevel?: "AA" | "AAA" }) {
  const { isChecked, toggle } = useProgress();
  const { locale, t } = usePreferences();
  const localized = localizeChecklistItem(item, locale);
  const done = isChecked(item.id);
  const baseCategory = categories.find((entry) => entry.id === item.category);
  const category = locale === "en" ? baseCategory : categoryTranslations[locale][item.category];

  return (
    <article className={`check-card ${done ? "is-done" : ""} ${compact ? "is-compact" : ""}`}>
      <div className="check-card-topline">
        <span className={`category-dot dot-${item.category}`} aria-hidden="true" />
        <span>{category?.shortLabel}</span>
        <span className="effort">{item.effort === "quick" ? t("check.quick") : t("check.discussion")}</span>
      </div>
      <div className="check-card-title-row">
        <h3>{localized.title}</h3>
        <button
          className="check-toggle"
          type="button"
          aria-pressed={done}
          aria-label={`${done ? t("check.incomplete") : t("check.complete")}: ${localized.title}`}
          onClick={() => toggle(item.id)}
        >
          <span aria-hidden="true">{done ? "✓" : ""}</span>
        </button>
      </div>
      <p className="prompt">{localized.prompt}</p>
      {!compact && (
        <details>
          <summary>{t("check.how")}</summary>
          <div className="detail-content">
            <p>{localized.how}</p>
            <p className="why"><strong>{t("check.why")}</strong> {localized.why}</p>
          </div>
        </details>
      )}
      <div className="standards-references" aria-label={t("check.references")}>
        <span>{t("check.references")}</span>
        <div>
          {item.wcag.filter((criterion) => targetLevel !== "AA" || wcagCriteria[criterion]?.level !== "AAA").map((criterion) => <a key={criterion} href={wcagUnderstandingUrl(criterion)} target="_blank" rel="noreferrer">WCAG {criterion} <small>{wcagCriteria[criterion]?.level}</small><b aria-hidden="true">↗</b></a>)}
          <a href={eaaRegulationUrl} target="_blank" rel="noreferrer">{t("check.eaa")} <b aria-hidden="true">↗</b></a>
          <a href={en301549ContextUrl} target="_blank" rel="noreferrer">{t("check.en301549")} <b aria-hidden="true">↗</b></a>
        </div>
      </div>
    </article>
  );
}
