import { Link, Navigate, useParams } from "react-router-dom";
import { getChecklistItem, getComponentGuide, localizeComponentGuide } from "@a11y/content";
import { ChecklistCard } from "../components/ChecklistCard";
import { usePreferences } from "../preferences";

export function ComponentPage() {
  const { slug = "" } = useParams();
  const baseGuide = getComponentGuide(slug);
  const { locale, t } = usePreferences();
  if (!baseGuide) return <Navigate to="/components" replace />;
  const guide = localizeComponentGuide(baseGuide, locale);
  const items = guide.checklistIds.map(getChecklistItem).filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="page-width page-content component-detail">
      <Link className="back-link" to="/components"><span aria-hidden="true">←</span> {t("detail.all")}</Link>
      <header className="component-detail-hero">
        <div className="detail-icon" aria-hidden="true">{guide.icon}</div>
        <div><p className="eyebrow"><span /> {t("detail.guide")}</p><h1>{guide.name}</h1><p>{guide.intro}</p></div>
      </header>

      <section className="question-section">
        <p className="section-number">{t("detail.ask")}</p>
        <ol>{guide.questions.map((question, index) => <li key={question}><span>0{index + 1}</span><p>{question}</p></li>)}</ol>
      </section>

      <section className="annotation-section">
        <div className="annotation-heading"><div><p className="section-number">{t("detail.annotation")}</p><h2>{t("detail.intent")}</h2></div><p>{t("detail.annotationCopy")}</p></div>
        <div className="annotation-board">
          <div className="annotation-pin" aria-hidden="true">A</div>
          <dl>
            <div><dt>{t("detail.role")}</dt><dd>{guide.annotation.role}</dd></div>
            <div><dt>{t("detail.name")}</dt><dd>{guide.annotation.name}</dd></div>
            <div><dt>{t("detail.state")}</dt><dd>{guide.annotation.state}</dd></div>
            <div><dt>{t("detail.behavior")}</dt><dd>{guide.annotation.behavior}</dd></div>
          </dl>
        </div>
      </section>

      <section className="related-checks">
        <div className="section-heading-row"><div><p className="section-number">{t("detail.related")}</p><h2>{t("detail.review")}</h2></div><p>{items.length} {t("detail.selected")}</p></div>
        <div className="checklist-grid">{items.map((item) => <ChecklistCard item={item} key={item.id} />)}</div>
      </section>
    </div>
  );
}
