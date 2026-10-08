import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { categories, categoryTranslations, checklist, localizeChecklistItem, wcagCriteria, type CategoryId } from "@a11y/content";
import { ChecklistCard } from "../components/ChecklistCard";
import { ProgressRing } from "../components/ProgressRing";
import { useProgress } from "../progress";
import { usePreferences } from "../preferences";

type Platform = "web" | "mobile";
type TargetLevel = "AA" | "AAA";

const platformPriorityExclusions: Record<Platform, Set<string>> = {
  web: new Set(),
  mobile: new Set(["heading-order", "focus-visible", "focus-order", "overlay-focus"])
};

export function ChecklistPage() {
  const [params, setParams] = useSearchParams();
  const initialCategory = params.get("category") as CategoryId | null;
  const [category, setCategory] = useState<CategoryId | "all">(
    categories.some((item) => item.id === initialCategory) ? initialCategory! : "all"
  );
  const [query, setQuery] = useState("");
  const [effort, setEffort] = useState<"all" | "quick" | "thoughtful">("all");
  const requestedPlatform = params.get("platform");
  const initialPlatform: Platform = requestedPlatform === "mobile" || requestedPlatform === "ios" || requestedPlatform === "android" ? "mobile" : "web";
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [targetLevel, setTargetLevel] = useState<TargetLevel>(params.get("level") === "AAA" ? "AAA" : "AA");
  const { checked, reset } = useProgress();
  const { locale, t } = usePreferences();
  const localizedCategories = categories.map((item) => locale === "en" ? item : { id: item.id, ...categoryTranslations[locale][item.id] });

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return checklist.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const matchesEffort = effort === "all" || item.effort === effort;
      const matchesPlatform = !platformPriorityExclusions[platform].has(item.id);
      const matchesLevel = targetLevel === "AAA" || item.wcag.some((criterion) => wcagCriteria[criterion]?.level !== "AAA");
      const localized = localizeChecklistItem(item, locale);
      const haystack = `${localized.title} ${localized.prompt} ${item.tags.join(" ")}`.toLowerCase();
      return matchesCategory && matchesEffort && matchesPlatform && matchesLevel && (!normalized || haystack.includes(normalized));
    });
  }, [category, effort, locale, platform, query, targetLevel]);

  function selectCategory(value: CategoryId | "all") {
    setCategory(value);
    if (value === "all") params.delete("category");
    else params.set("category", value);
    setParams(params, { replace: true });
  }

  function selectPlatform(value: Platform) {
    setPlatform(value);
    params.set("platform", value);
    setParams(params, { replace: true });
  }

  function selectLevel(value: TargetLevel) {
    setTargetLevel(value);
    params.set("level", value);
    setParams(params, { replace: true });
  }

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setEffort("all");
    setPlatform("web");
    setTargetLevel("AA");
    setParams({ platform: "web", level: "AA" }, { replace: true });
  }

  const platformLabels: Record<Platform, string> = {
    web: "Web",
    mobile: t("check.mobile")
  };

  return (
    <div className="page-width page-content checklist-page">
      <header className="page-hero compact-hero">
        <div>
          <p className="eyebrow"><span /> {t("check.eyebrow")}</p>
          <h1>{t("check.title1")}<br /><em>{t("check.title2")}</em></h1>
          <p>{t("check.copy")}</p>
        </div>
        <div className="progress-panel">
          <ProgressRing current={checked.size} total={checklist.length} />
          <p><strong>{checked.size} / {checklist.length}</strong> {t("check.decisions")}</p>
          {checked.size > 0 && <button className="plain-button" type="button" onClick={reset}>{t("check.reset")}</button>}
        </div>
      </header>

      <section className="filter-panel" aria-label="Checklist filters">
        <div className="search-field">
          <label htmlFor="checklist-search">{t("check.search")}</label>
          <div><span aria-hidden="true">⌕</span><input id="checklist-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("check.placeholder")} /></div>
        </div>
        <div className="standards-filter-group">
          <fieldset className="platform-filter">
            <legend>{t("check.platform")}</legend>
            <div className="filter-chips">{(Object.keys(platformLabels) as Platform[]).map((option) => <button type="button" className={platform === option ? "active" : ""} aria-pressed={platform === option} onClick={() => selectPlatform(option)} key={option}>{platformLabels[option]}</button>)}</div>
          </fieldset>
          <fieldset className="target-filter">
            <legend>{t("check.level")}</legend>
            <div className="filter-chips">
              <button type="button" className={targetLevel === "AA" ? "active" : ""} aria-pressed={targetLevel === "AA"} onClick={() => selectLevel("AA")}>{t("check.levelAA")}</button>
              <button type="button" className={targetLevel === "AAA" ? "active" : ""} aria-pressed={targetLevel === "AAA"} onClick={() => selectLevel("AAA")}>{t("check.levelAAA")}</button>
            </div>
          </fieldset>
        </div>
        <fieldset className="effort-filter">
          <legend>{t("check.effort")}</legend>
          <select value={effort} onChange={(event) => setEffort(event.target.value as typeof effort)}>
            <option value="all">{t("check.any")}</option>
            <option value="quick">{t("check.quick")}</option>
            <option value="thoughtful">{t("check.discussion")}</option>
          </select>
        </fieldset>
        <fieldset className="category-filter">
          <legend>{t("check.category")}</legend>
          <div className="filter-chips">
            <button type="button" className={category === "all" ? "active" : ""} onClick={() => selectCategory("all")}>{t("check.all")}</button>
            {localizedCategories.map((item) => <button type="button" className={category === item.id ? "active" : ""} onClick={() => selectCategory(item.id)} key={item.id}>{item.shortLabel}</button>)}
          </div>
        </fieldset>
      </section>

      <div className="results-bar" aria-live="polite">
        <p><strong>{visibleItems.length}</strong> {visibleItems.length === 1 ? t("check.one") : t("check.many")} <span className="results-context">{platformLabels[platform]} · WCAG 2.2 {targetLevel}</span></p>
        {(query || category !== "all" || effort !== "all" || platform !== "web" || targetLevel !== "AA") && <button type="button" className="plain-button" onClick={clearFilters}>{t("check.clear")}</button>}
      </div>

      {visibleItems.length ? (
        <div className="checklist-grid">{visibleItems.map((item) => <ChecklistCard item={item} targetLevel={targetLevel} key={item.id} />)}</div>
      ) : (
        <div className="empty-state"><span aria-hidden="true">◎</span><h2>{t("check.empty")}</h2><p>{t("check.emptyCopy")}</p></div>
      )}
    </div>
  );
}
