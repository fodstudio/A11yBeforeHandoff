import type { Locale } from "@a11y/content";

export const supportedLocales = ["en", "ja", "ko"] as const satisfies readonly Locale[];
export const defaultLocale: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function splitLocalizedPath(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const [, first = "", ...rest] = normalized.split("/");
  if (!isLocale(first)) return { locale: null, basePath: normalized || "/" };
  const basePath = `/${rest.join("/")}`.replace(/\/$/, "") || "/";
  return { locale: first, basePath };
}

export function localizedPath(locale: Locale, target = "/") {
  const match = target.match(/^([^?#]*)([?#].*)?$/);
  const pathname = match?.[1] || "/";
  const suffix = match?.[2] || "";
  const { basePath } = splitLocalizedPath(pathname);
  return `/${locale}${basePath === "/" ? "" : basePath}${suffix}`;
}

export function localizedUrl(siteUrl: string, locale: Locale, basePath: string) {
  return `${siteUrl}${localizedPath(locale, basePath)}`;
}
