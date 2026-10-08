import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { componentGuides, localizeComponentGuide, type Locale } from "@a11y/content";
import { usePreferences } from "./preferences";

const siteName = "A11y Handoff";
const siteUrl = (import.meta.env.VITE_SITE_URL || "https://a11yhandoff.com").replace(/\/$/, "");

type SeoCopy = { title: string; description: string };
type StaticRoute = "/" | "/audit" | "/checklist" | "/components" | "/figma-plugin" | "/about";

const routeCopy: Record<Locale, Record<StaticRoute, SeoCopy>> = {
  en: {
    "/": { title: "Accessibility Handoff Checklist & URL Audit", description: "Free accessibility checklist, URL audit, component guidance, and Figma handoff tools based on WCAG and EAA context." },
    "/audit": { title: "Free WCAG URL Accessibility Audit", description: "Check a public web page or Figma link for accessibility issues and get a practical WCAG-oriented report." },
    "/checklist": { title: "WCAG Accessibility Checklist", description: "Review color, content, structure, interaction, focus, motion, and media decisions before handoff." },
    "/components": { title: "Accessible UI Component Guides", description: "Practical accessibility guidance for buttons, dialogs, forms, navigation, cards, and toasts." },
    "/figma-plugin": { title: "Free Figma Accessibility Plugin", description: "Run selection checks, create handoff annotations, review a checklist, and export accessibility notes from Figma." },
    "/about": { title: "Why A11y Handoff Exists", description: "See how A11y Handoff turns accessibility standards into practical questions for digital product teams." }
  },
  ja: {
    "/": { title: "アクセシビリティ・チェックリストとURL診断", description: "WCAGとEAAの文脈に基づく、無料のアクセシビリティ・チェックリスト、URL診断、コンポーネントガイド、Figmaツール。" },
    "/audit": { title: "無料のWCAG URLアクセシビリティ診断", description: "公開WebページやFigmaリンクを確認し、WCAGに基づく実践的なアクセシビリティレポートを作成します。" },
    "/checklist": { title: "WCAGアクセシビリティ・チェックリスト", description: "色、コンテンツ、構造、操作、フォーカス、動き、メディアをハンドオフ前に確認します。" },
    "/components": { title: "アクセシブルなUIコンポーネントガイド", description: "ボタン、ダイアログ、フォーム、ナビゲーション、カード、トーストの実践的なアクセシビリティガイド。" },
    "/figma-plugin": { title: "無料Figmaアクセシビリティプラグイン", description: "Figmaで選択チェック、注釈作成、チェックリスト確認、アクセシビリティノートの書き出しができます。" },
    "/about": { title: "A11y Handoffについて", description: "アクセシビリティ基準を、デジタルプロダクトチームの実践的な問いに変える理由を紹介します。" }
  },
  ko: {
    "/": { title: "접근성 핸드오프 체크리스트와 URL 진단", description: "WCAG와 EAA 맥락을 바탕으로 한 무료 접근성 체크리스트, URL 진단, 컴포넌트 가이드와 Figma 도구입니다." },
    "/audit": { title: "무료 WCAG URL 접근성 진단", description: "공개 웹페이지나 Figma 링크를 확인하고 WCAG 중심의 실용적인 접근성 리포트를 받아보세요." },
    "/checklist": { title: "WCAG 접근성 체크리스트", description: "색상, 콘텐츠, 구조, 인터랙션, 포커스, 모션과 미디어 결정을 핸드오프 전에 검토하세요." },
    "/components": { title: "접근 가능한 UI 컴포넌트 가이드", description: "버튼, 대화상자, 폼, 내비게이션, 카드와 토스트를 위한 실용적인 접근성 가이드입니다." },
    "/figma-plugin": { title: "무료 Figma 접근성 플러그인", description: "Figma에서 선택 항목 검사, 핸드오프 애노테이션, 체크리스트 검토와 접근성 노트 내보내기를 할 수 있습니다." },
    "/about": { title: "A11y Handoff를 만든 이유", description: "접근성 표준을 디지털 제품 팀이 활용할 수 있는 실용적인 질문으로 바꾸는 이유를 소개합니다." }
  }
};

const componentDescription: Record<Locale, string> = {
  en: "Accessibility guidance, questions, checks, and handoff annotations for this UI component.",
  ja: "このUIコンポーネントのアクセシビリティガイド、確認項目、問い、ハンドオフ注釈。",
  ko: "이 UI 컴포넌트를 위한 접근성 가이드, 질문, 체크와 핸드오프 애노테이션입니다."
};
const componentTitle: Record<Locale, string> = {
  en: "Accessibility Guide",
  ja: "アクセシビリティガイド",
  ko: "접근성 가이드"
};

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element!.setAttribute(name, value));
}

function setCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
}

export function SeoManager() {
  const { pathname } = useLocation();
  const { locale } = usePreferences();
  const seo = useMemo(() => {
    const staticCopy = routeCopy[locale][pathname as StaticRoute];
    if (staticCopy) return { ...staticCopy, index: true };

    const slug = pathname.startsWith("/components/") ? pathname.slice("/components/".length) : "";
    const guide = componentGuides.find((item) => item.slug === slug);
    if (guide) {
      const localized = localizeComponentGuide(guide, locale);
      return { title: `${localized.name} ${componentTitle[locale]}`, description: `${localized.summary} ${componentDescription[locale]}`, index: true };
    }
    return { title: "Page not found", description: "This page could not be found.", index: false };
  }, [locale, pathname]);

  useEffect(() => {
    const pageTitle = `${seo.title} | ${siteName}`;
    const canonical = `${siteUrl}${pathname === "/" ? "/" : pathname}`;
    document.title = pageTitle;
    setCanonical(canonical);
    setMeta('meta[name="description"]', { name: "description", content: seo.description });
    setMeta('meta[name="robots"]', { name: "robots", content: seo.index ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, nofollow" });
    setMeta('meta[property="og:title"]', { property: "og:title", content: pageTitle });
    setMeta('meta[property="og:description"]', { property: "og:description", content: seo.description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    setMeta('meta[property="og:locale"]', { property: "og:locale", content: locale === "ja" ? "ja_JP" : locale === "ko" ? "ko_KR" : "en_US" });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: pageTitle });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: seo.description });

    let script = document.head.querySelector<HTMLScriptElement>("#page-structured-data");
    if (!script) {
      script = document.createElement("script");
      script.id = "page-structured-data";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: seo.title,
      description: seo.description,
      url: canonical,
      inLanguage: locale,
      isPartOf: { "@id": `${siteUrl}/#website` }
    });
  }, [locale, pathname, seo]);

  return null;
}
