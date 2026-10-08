import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HomePage } from "./pages/HomePage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { ComponentsPage } from "./pages/ComponentsPage";
import { ComponentPage } from "./pages/ComponentPage";
import { AboutPage } from "./pages/AboutPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AuditPage } from "./pages/AuditPage";
import { FigmaPluginPage } from "./pages/FigmaPluginPage";
import { usePreferences } from "./preferences";
import type { Locale } from "@a11y/content";

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

export function App() {
  const { locale, theme, setLocale, toggleTheme, t } = usePreferences();
  return (
    <div className="site-shell">
      <ScrollToTop />
      <a className="skip-link" href="#main">{t("skip")}</a>
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="A11y Before Handoff home">
          <Mark />
          <span>Before Handoff</span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/audit">{t("nav.audit")}</NavLink>
          <NavLink to="/checklist">{t("nav.checklist")}</NavLink>
          <NavLink to="/components">{t("nav.components")}</NavLink>
          <NavLink to="/figma-plugin">{t("nav.plugin")}<span className="nav-new">NEW</span></NavLink>
          <NavLink to="/about">{t("nav.about")}</NavLink>
        </nav>
        <div className="header-tools">
          <label className="language-picker"><span className="sr-only">Language</span><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}><option value="en">EN</option><option value="ja">日本語</option><option value="ko">한국어</option></select></label>
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === "light" ? t("theme.dark") : t("theme.light")} title={theme === "light" ? t("theme.dark") : t("theme.light")}><span aria-hidden="true">{theme === "light" ? "◐" : "☀"}</span></button>
        </div>
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/components" element={<ComponentsPage />} />
          <Route path="/components/:slug" element={<ComponentPage />} />
          <Route path="/figma-plugin" element={<FigmaPluginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div>
          <Mark />
          <p>{t("footer.line1")}</p>
        </div>
        <div className="footer-note">
          <p>{t("footer.line2")}</p>
          <p>{t("footer.line3")}</p>
          <p className="footer-copyright">{t("footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
