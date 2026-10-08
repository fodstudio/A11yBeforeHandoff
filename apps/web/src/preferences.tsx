import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@a11y/content";
import { messages, type MessageKey } from "./translations";

type Theme = "light" | "dark";
interface Preferences { locale: Locale; theme: Theme; setLocale: (locale: Locale) => void; toggleTheme: () => void; t: (key: MessageKey) => string; }
const Context = createContext<Preferences | null>(null);

function initialTheme(): Theme {
  const saved = localStorage.getItem("a11y-theme");
  if (saved === "light" || saved === "dark") return saved;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function initialLocale(): Locale {
  const saved = localStorage.getItem("a11y-locale");
  if (saved === "ja" || saved === "ko" || saved === "en") return saved;
  return navigator.language.startsWith("ja") ? "ja" : navigator.language.startsWith("ko") ? "ko" : "en";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => { document.documentElement.lang = locale; localStorage.setItem("a11y-locale", locale); }, [locale]);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; localStorage.setItem("a11y-theme", theme); }, [theme]);
  const value = useMemo(() => ({ locale, theme, setLocale, toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"), t: (key: MessageKey) => messages[locale][key] }), [locale, theme]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("usePreferences must be inside PreferencesProvider");
  return value;
}

