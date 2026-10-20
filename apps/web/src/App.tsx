import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { ComponentsPage } from "./pages/ComponentsPage";
import { ComponentPage } from "./pages/ComponentPage";
import { AboutPage } from "./pages/AboutPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AuditPage } from "./pages/AuditPage";
import { FigmaPluginPage } from "./pages/FigmaPluginPage";
import { I18nPage } from "./pages/I18nPage";
import { usePreferences } from "./preferences";
import { SeoManager } from "./SeoManager";
import { ContactDialog } from "./components/ContactDialog";
import type { Locale } from "@a11y/content";
import { localizedPath, supportedLocales } from "./routing";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: "start" });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}

function Mark() {
  return (
    <span className="mark" aria-hidden="true">
      <span>A</span><span>11</span><span>y</span>
    </span>
  );
}

function LegacyRouteRedirect() {
  const { locale } = usePreferences();
  const location = useLocation();
  return <Navigate to={`${localizedPath(locale, location.pathname)}${location.search}${location.hash}`} replace />;
}

export function App() {
  const { locale, theme, setLocale, toggleTheme, t } = usePreferences();
  const [contactOpen, setContactOpen] = useState(false);
  return (
    <div className="site-shell">
      <ScrollToTop />
      <SeoManager />
      <a className="skip-link" href="#main">{t("skip")}</a>
      <header className="site-header">
        <NavLink className="brand" to={localizedPath(locale)} aria-label="A11y Handoff home">
          <Mark />
          <span>Handoff</span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to={localizedPath(locale, "/audit")}>{t("nav.audit")}</NavLink>
          <NavLink to={localizedPath(locale, "/checklist")}>{t("nav.checklist")}</NavLink>
          <NavLink to={localizedPath(locale, "/components")}>{t("nav.components")}</NavLink>
          <NavLink to={localizedPath(locale, "/figma-plugin")}>{t("nav.plugin")}<span className="nav-new">NEW</span></NavLink>
          <NavLink to={localizedPath(locale, "/about")}>{t("nav.about")}</NavLink>
        </nav>
        <div className="header-tools">
          <label className="language-picker"><span className="sr-only">Language</span><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}><option value="en">EN</option><option value="ja">日本語</option><option value="ko">한국어</option></select></label>
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === "light" ? t("theme.dark") : t("theme.light")} title={theme === "light" ? t("theme.dark") : t("theme.light")}><span aria-hidden="true">{theme === "light" ? "◐" : "☀"}</span></button>
        </div>
      </header>
      <main id="main">
        <Routes>
          {supportedLocales.map((routeLocale) => (
            <Route key={routeLocale}>
              <Route path={`/${routeLocale}`} element={<HomePage />} />
              <Route path={`/${routeLocale}/checklist`} element={<ChecklistPage />} />
              <Route path={`/${routeLocale}/audit`} element={<AuditPage />} />
              <Route path={`/${routeLocale}/components`} element={<ComponentsPage />} />
              <Route path={`/${routeLocale}/components/:slug`} element={<ComponentPage />} />
              <Route path={`/${routeLocale}/figma-plugin`} element={<FigmaPluginPage />} />
              <Route path={`/${routeLocale}/i18n`} element={<I18nPage />} />
              <Route path={`/${routeLocale}/about`} element={<AboutPage onContactClick={() => setContactOpen(true)} />} />
            </Route>
          ))}
          <Route path="/" element={<Navigate to="/en" replace />} />
          <Route path="/checklist" element={<LegacyRouteRedirect />} />
          <Route path="/audit" element={<LegacyRouteRedirect />} />
          <Route path="/components" element={<LegacyRouteRedirect />} />
          <Route path="/components/:slug" element={<LegacyRouteRedirect />} />
          <Route path="/figma-plugin" element={<LegacyRouteRedirect />} />
          <Route path="/i18n" element={<LegacyRouteRedirect />} />
          <Route path="/about" element={<LegacyRouteRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div>
          <Mark />
          <p>{t("footer.line1")}</p>
          <div className="footer-actions">
            <button className="footer-contact" type="button" onClick={() => setContactOpen(true)}>{t("footer.contact")} <span aria-hidden="true">↗</span></button>
            <NavLink className="footer-contact footer-preview-link" to={localizedPath(locale, "/i18n")}>{t("footer.i18n")} <span aria-hidden="true">↗</span></NavLink>
          </div>
        </div>
        <div className="footer-note">
          <p>{t("footer.line2")}</p>
          <p>{t("footer.line3")}</p>
          <p>{t("footer.analytics")}</p>
          <p className="footer-copyright">{t("footer.copyright")}</p>
        </div>
      </footer>
      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}
