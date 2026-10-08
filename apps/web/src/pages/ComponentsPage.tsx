import { Link } from "react-router-dom";
import { componentGuides, localizeComponentGuide } from "@a11y/content";
import { usePreferences } from "../preferences";

export function ComponentsPage() {
  const { locale, t } = usePreferences();
  const guides = componentGuides.map((guide) => localizeComponentGuide(guide, locale));
  return (
    <div className="page-width page-content">
      <header className="page-hero components-hero">
        <div>
          <p className="eyebrow"><span /> {t("components.eyebrow")}</p>
          <h1>{t("components.title1")}<br /><em>{t("components.title2")}</em></h1>
        </div>
        <p>{t("components.copy")}</p>
      </header>
      <div className="component-library">
        {guides.map((guide, index) => (
          <Link to={`/components/${guide.slug}`} className="library-card" key={guide.slug}>
            <span className="library-number">0{index + 1}</span>
            <span className="library-icon" aria-hidden="true">{guide.icon}</span>
            <div><h2>{guide.name}</h2><p>{guide.summary}</p></div>
            <span className="circle-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
      <aside className="request-card">
        <p className="section-number">{t("components.growing")}</p>
        <h2>{t("components.next")}</h2><p>{t("components.nextCopy")}</p>
      </aside>
    </div>
  );
}
