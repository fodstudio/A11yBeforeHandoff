import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { componentGuides, type Locale } from "@a11y/content";
import { App } from "../src/App";
import { PreferencesProvider } from "../src/preferences";
import { ProgressProvider } from "../src/progress";
import { getSeoPageData, siteUrl } from "../src/SeoManager";
import { localizedPath, localizedUrl, supportedLocales } from "../src/routing";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const webDirectory = resolve(scriptDirectory, "..");
const distDirectory = resolve(webDirectory, "dist");
const prerenderDirectory = resolve(distDirectory, "prerender");
const template = await readFile(resolve(distDirectory, "index.html"), "utf8");
const dateParts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).formatToParts(new Date()).map(({ type, value }) => [type, value]));
const lastModified = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;

const baseRoutes = [
  "/",
  "/audit",
  "/checklist",
  "/components",
  ...componentGuides.map((guide) => `/components/${guide.slug}`),
  "/figma-plugin",
  "/about"
];

function escapeAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeText(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function replaceMeta(html: string, attribute: "name" | "property", key: string, content: string) {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s+content="[^"]*"\\s*\\/?>`);
  return html.replace(pattern, `<meta ${attribute}="${key}" content="${escapeAttribute(content)}" />`);
}

function alternateLinks(basePath: string) {
  const links = supportedLocales.map((locale) => `<link rel="alternate" hreflang="${locale}" href="${escapeAttribute(localizedUrl(siteUrl, locale, basePath))}" />`);
  links.push(`<link rel="alternate" hreflang="x-default" href="${escapeAttribute(localizedUrl(siteUrl, "en", basePath))}" />`);
  return links.join("\n    ");
}

function renderPage(pathname: string, locale: Locale) {
  const seo = getSeoPageData(pathname, locale);
  const markup = renderToString(
    <StaticRouter location={pathname}>
      <PreferencesProvider initialLocale={locale}>
        <ProgressProvider><App /></ProgressProvider>
      </PreferencesProvider>
    </StaticRouter>
  );
  const pageTitle = `${seo.title} | A11y Handoff`;
  const pageStructuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo.title,
    description: seo.description,
    url: seo.canonical,
    inLanguage: locale,
    isPartOf: { "@id": `${siteUrl}/#website` }
  }).replaceAll("<", "\\u003c");

  let html = template
    .replace('<html lang="en">', `<html lang="${locale}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeText(pageTitle)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${escapeAttribute(seo.canonical)}" />\n    ${alternateLinks(seo.basePath)}`)
    .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
    .replace("</head>", `    <script id="page-structured-data" type="application/ld+json">${pageStructuredData}</script>\n  </head>`);

  html = replaceMeta(html, "name", "description", seo.description);
  html = replaceMeta(html, "name", "robots", seo.index ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, nofollow");
  html = replaceMeta(html, "property", "og:title", pageTitle);
  html = replaceMeta(html, "property", "og:description", seo.description);
  html = replaceMeta(html, "property", "og:url", seo.canonical);
  html = replaceMeta(html, "property", "og:locale", locale === "ja" ? "ja_JP" : locale === "ko" ? "ko_KR" : "en_US");
  const alternateOgLocales = supportedLocales
    .filter((alternateLocale) => alternateLocale !== locale)
    .map((alternateLocale) => alternateLocale === "ja" ? "ja_JP" : alternateLocale === "ko" ? "ko_KR" : "en_US")
    .map((alternateLocale) => `    <meta property="og:locale:alternate" content="${alternateLocale}" />`)
    .join("\n");
  html = html
    .replace(/\s*<meta property="og:locale:alternate" content="[^"]*"\s*\/?>/g, "")
    .replace(/(<meta property="og:locale" content="[^"]*"\s*\/?>)/, `$1\n${alternateOgLocales}`);
  html = replaceMeta(html, "name", "twitter:title", pageTitle);
  html = replaceMeta(html, "name", "twitter:description", seo.description);
  return html;
}

const routeFiles: Record<string, string> = {};
for (const locale of supportedLocales) {
  for (const basePath of baseRoutes) {
    const pathname = localizedPath(locale, basePath);
    const relativeFile = `${locale}${basePath === "/" ? "/index" : basePath}.html`;
    const outputFile = resolve(prerenderDirectory, relativeFile);
    await mkdir(dirname(outputFile), { recursive: true });
    await writeFile(outputFile, renderPage(pathname, locale));
    routeFiles[pathname] = relative(prerenderDirectory, outputFile);
  }

  const notFoundFile = resolve(prerenderDirectory, `${locale}/404.html`);
  await mkdir(dirname(notFoundFile), { recursive: true });
  await writeFile(notFoundFile, renderPage(`/${locale}/not-found`, locale));
}

await writeFile(resolve(prerenderDirectory, "routes.json"), JSON.stringify({ routes: routeFiles }, null, 2));

const sitemapEntries = supportedLocales.flatMap((locale) => baseRoutes.map((basePath) => {
  const alternates = supportedLocales.map((alternateLocale) =>
    `    <xhtml:link rel="alternate" hreflang="${alternateLocale}" href="${localizedUrl(siteUrl, alternateLocale, basePath)}" />`
  );
  alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${localizedUrl(siteUrl, "en", basePath)}" />`);
  return [
    "  <url>",
    `    <loc>${localizedUrl(siteUrl, locale, basePath)}</loc>`,
    `    <lastmod>${lastModified}</lastmod>`,
    ...alternates,
    "  </url>"
  ].join("\n");
}));

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...sitemapEntries,
  "</urlset>",
  ""
].join("\n");

await writeFile(resolve(distDirectory, "sitemap.xml"), sitemap);
console.log(`Prerendered ${Object.keys(routeFiles).length} localized pages and generated sitemap.xml.`);
