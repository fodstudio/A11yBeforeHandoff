import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Locale } from "@a11y/content";
import { messages, type MessageKey } from "./translations";
import { defaultLocale, localizedPath, splitLocalizedPath } from "./routing";

type Theme = "light" | "dark";
interface Preferences { locale: Locale; theme: Theme; setLocale: (locale: Locale) => void; toggleTheme: () => void; t: (key: MessageKey) => string; }
const Context = createContext<Preferences | null>(null);

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("a11y-theme");
  if (saved === "light" || saved === "dark") return saved;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function initialLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const routeLocale = splitLocalizedPath(window.location.pathname).locale;
  if (routeLocale) return routeLocale;
  const saved = localStorage.getItem("a11y-locale");
  if (saved === "ja" || saved === "ko" || saved === "en") return saved;
  return navigator.language.startsWith("ja") ? "ja" : navigator.language.startsWith("ko") ? "ko" : "en";
}

export function PreferencesProvider({ children, initialLocale: serverLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeLocale = splitLocalizedPath(location.pathname).locale;
  const [locale, setLocaleState] = useState<Locale>(() => serverLocale || routeLocale || initialLocale());
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => { if (routeLocale && routeLocale !== locale) setLocaleState(routeLocale); }, [locale, routeLocale]);
  useEffect(() => { document.documentElement.lang = locale; localStorage.setItem("a11y-locale", locale); }, [locale]);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; localStorage.setItem("a11y-theme", theme); }, [theme]);
  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    const destination = `${localizedPath(nextLocale, location.pathname)}${location.search}${location.hash}`;
    navigate(destination);
  }, [location.hash, location.pathname, location.search, navigate]);
  const value = useMemo(() => ({ locale, theme, setLocale, toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"), t: (key: MessageKey) => messages[locale][key] }), [locale, setLocale, theme]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("usePreferences must be inside PreferencesProvider");
  return value;
}

