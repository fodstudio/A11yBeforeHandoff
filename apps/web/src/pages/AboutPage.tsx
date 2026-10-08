import { Link } from "react-router-dom";
import { usePreferences } from "../preferences";

export function AboutPage() {
  const { t } = usePreferences();
  return (
    <div className="page-width page-content about-page">
      <header className="page-hero about-hero"><p className="eyebrow"><span /> {t("about.eyebrow")}</p><h1>{t("about.title1")}<br /><em>{t("about.title2")}</em></h1><p>{t("about.lead")}</p></header>
      <section className="about-grid">
        <div><p className="section-number">{t("about.position")}</p><h2>{t("about.teamHeading")}</h2></div>
        <div className="prose"><p>{t("about.teamP1")}</p><p>{t("about.p2")}</p></div>
      </section>
      <section className="user-friction">
        <div className="user-friction-heading">
          <p className="section-number">{t("about.frictionEyebrow")}</p>
          <h2>{t("about.frictionTitle")}</h2>
          <p>{t("about.frictionLead")}</p>
        </div>
        <ol className="user-friction-list">
          <li><span>01</span><div><h3>{t("about.friction1DisplayTitle")}</h3><p>{t("about.friction1Copy")}</p></div></li>
          <li><span>02</span><div><h3>{t("about.friction2Title")}</h3><p>{t("about.friction2Copy")}</p></div></li>
          <li><span>03</span><div><h3>{t("about.friction3Title")}</h3><p>{t("about.friction3Copy")}</p></div></li>
        </ol>
      </section>
      <section className="boundaries">
        <p className="section-number">{t("about.boundary")}</p>
        <div className="boundary-grid">
          <article><span aria-hidden="true">✓</span><h2>{t("about.yes")}</h2><p>{t("about.yesCopy")}</p></article>
          <article><span aria-hidden="true">×</span><h2>{t("about.no")}</h2><p>{t("about.noCopy")}</p></article>
        </div>
      </section>
      <section className="about-grid privacy-grid">
        <div><p className="section-number">{t("privacy.eyebrow")}</p><h2>{t("privacy.title")}</h2></div>
        <div className="prose"><p>{t("privacy.files")}</p><p>{t("privacy.progress")}</p></div>
      </section>
      <section className="cta-section"><p className="section-number">{t("about.ready")}</p><h2>{t("about.cta1")}<br />{t("about.cta2")}</h2><Link className="button button-primary" to="/checklist">{t("about.start")} <span aria-hidden="true">→</span></Link></section>
    </div>
  );
}
