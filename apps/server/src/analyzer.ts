import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

export type AuditStatus = "pass" | "warning" | "fail" | "manual";
export type AuditCategory = "document" | "structure" | "images" | "forms" | "interaction" | "media";
export type AuditPlatform = "web" | "mobile";
export type AuditLevel = "AA" | "AAA";

export interface AuditResult {
  id: string;
  category: AuditCategory;
  status: AuditStatus;
  title: string;
  detail: string;
  count?: number;
  examples?: string[];
  wcag?: string[];
}

export interface AuditReport {
  kind: "web" | "figma";
  platform: AuditPlatform;
  targetLevel: AuditLevel;
  url: string;
  finalUrl: string;
  pageTitle: string;
  scannedAt: string;
  score: number | null;
  summary: { passed: number; warnings: number; failed: number; manual: number; total: number };
  results: AuditResult[];
  meta: { responseMs: number; htmlBytes: number; elementCount: number };
  figma?: { fileType: string; fileKey: string; nodeId?: string; embedUrl: string };
}

const text = (value: string | undefined) => value?.replace(/\s+/g, " ").trim() || "";
const examples = (values: string[]) => [...new Set(values.filter(Boolean))].slice(0, 4);

export function analyzeHtml(html: string, url: string, finalUrl: string, responseMs: number, targetLevel: AuditLevel = "AA"): AuditReport {
  const $ = cheerio.load(html);
  const results: AuditResult[] = [];
  const add = (result: AuditResult) => results.push(result);
  const passFail = (condition: boolean, base: Omit<AuditResult, "status">, failDetail: string) => add({ ...base, status: condition ? "pass" : "fail", detail: condition ? base.detail : failDetail });

  const pageTitle = text($("title").first().text());
  passFail(Boolean(pageTitle), { id: "page-title", category: "document", title: "Page has a descriptive title", detail: `Found “${pageTitle}”.`, wcag: ["2.4.2"] }, "No document title was found.");

  const lang = text($("html").attr("lang"));
  passFail(Boolean(lang), { id: "document-language", category: "document", title: "Page language is declared", detail: `Document language is “${lang}”.`, wcag: ["3.1.1"] }, "The html element has no lang attribute.");

  const viewport = $("meta[name='viewport']").attr("content") || "";
  const blocksZoom = /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0)?(?:\s|,|$)/i.test(viewport);
  add({ id: "viewport-zoom", category: "document", status: blocksZoom ? "fail" : "pass", title: "Viewport allows zoom", detail: blocksZoom ? "The viewport configuration appears to disable or severely limit zoom." : "No zoom-blocking viewport setting was detected.", wcag: ["1.4.4"] });

  const h1Count = $("h1").length;
  add({ id: "h1", category: "structure", status: h1Count === 1 ? "pass" : h1Count === 0 ? "fail" : "warning", title: "Page has one primary heading", detail: h1Count === 1 ? "One h1 was found." : `${h1Count} h1 elements were found.`, count: h1Count, wcag: ["1.3.1", "2.4.6"] });

  const headingSkips: string[] = [];
  let previousLevel = 0;
  $("h1,h2,h3,h4,h5,h6").each((_, el) => {
    const level = Number(el.tagName.slice(1));
    if (previousLevel && level > previousLevel + 1) headingSkips.push(`${el.tagName.toUpperCase()}: ${text($(el).text()).slice(0, 80)}`);
    previousLevel = level;
  });
  add({ id: "heading-order", category: "structure", status: headingSkips.length ? "warning" : "pass", title: "Heading levels follow a logical order", detail: headingSkips.length ? `${headingSkips.length} possible skipped heading level${headingSkips.length === 1 ? "" : "s"} found.` : "No skipped heading levels were detected.", count: headingSkips.length, examples: examples(headingSkips), wcag: ["1.3.1"] });

  const hasMain = $("main, [role='main']").length > 0;
  passFail(hasMain, { id: "main-landmark", category: "structure", title: "Main content landmark is present", detail: "A main landmark was found.", wcag: ["1.3.1", "2.4.1"] }, "No main element or role=main was found.");

  const ids = new Map<string, number>();
  $("[id]").each((_, el) => { const id = $(el).attr("id"); if (id) ids.set(id, (ids.get(id) || 0) + 1); });
  const duplicateIds = [...ids.entries()].filter(([, count]) => count > 1).map(([id, count]) => `#${id} (${count}×)`);
  add({ id: "duplicate-ids", category: "structure", status: duplicateIds.length ? "fail" : "pass", title: "IDs are unique", detail: duplicateIds.length ? `${duplicateIds.length} duplicate ID${duplicateIds.length === 1 ? "" : "s"} found.` : "No duplicate IDs were found.", count: duplicateIds.length, examples: examples(duplicateIds), wcag: ["4.1.1"] });

  const missingAlt: string[] = [];
  $("img").each((_, el) => { if ($(el).attr("alt") === undefined) missingAlt.push($(el).attr("src") || "image without src"); });
  add({ id: "image-alt", category: "images", status: missingAlt.length ? "fail" : "pass", title: "Images have alt attributes", detail: missingAlt.length ? `${missingAlt.length} image${missingAlt.length === 1 ? " is" : "s are"} missing an alt attribute.` : `All ${$("img").length} images have an alt attribute. Empty alt text may be appropriate for decorative images.`, count: missingAlt.length, examples: examples(missingAlt), wcag: ["1.1.1"] });

  const accessibleName = (el: AnyNode) => {
    const node = $(el);
    const labelledBy = node.attr("aria-labelledby")?.split(/\s+/).map((id) => text($("[id]").filter((_, candidate) => $(candidate).attr("id") === id).first().text())).join(" ");
    return text(node.attr("aria-label")) || text(labelledBy) || text(node.attr("title")) || text(node.text()) || text(node.find("img[alt]").attr("alt"));
  };

  const unnamedButtons: string[] = [];
  $("button, [role='button']").each((_, el) => { if (!accessibleName(el)) unnamedButtons.push($.html(el).slice(0, 140)); });
  add({ id: "button-name", category: "interaction", status: unnamedButtons.length ? "fail" : "pass", title: "Buttons have accessible names", detail: unnamedButtons.length ? `${unnamedButtons.length} button${unnamedButtons.length === 1 ? " has" : "s have"} no detectable name.` : "All buttons have a detectable accessible name.", count: unnamedButtons.length, examples: examples(unnamedButtons), wcag: ["4.1.2"] });

  const emptyLinks: string[] = [];
  const genericLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const name = accessibleName(el);
    if (!name) emptyLinks.push($(el).attr("href") || "empty href");
    else if (/^(click here|here|read more|learn more|more|詳細|もっと見る|여기|자세히|더 보기)$/i.test(name)) genericLinks.push(name);
  });
  add({ id: "link-name", category: "interaction", status: emptyLinks.length ? "fail" : genericLinks.length ? "warning" : "pass", title: "Links have meaningful names", detail: emptyLinks.length ? `${emptyLinks.length} link${emptyLinks.length === 1 ? " has" : "s have"} no detectable name.` : genericLinks.length ? `${genericLinks.length} potentially ambiguous link name${genericLinks.length === 1 ? "" : "s"} found.` : "No empty or obviously ambiguous link names were detected.", count: emptyLinks.length + genericLinks.length, examples: examples([...emptyLinks, ...genericLinks]), wcag: ["2.4.4"] });

  const unlabeledFields: string[] = [];
  $("input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea").each((_, el) => {
    const node = $(el); const id = node.attr("id");
    const named = text(node.attr("aria-label")) || text(node.attr("aria-labelledby")) || (id ? text($(`label[for='${id.replaceAll("'", "\\'")}']`).text()) : "") || text(node.closest("label").text());
    if (!named) unlabeledFields.push(`${el.tagName}${id ? `#${id}` : ""}${node.attr("name") ? `[name=${node.attr("name")}]` : ""}`);
  });
  add({ id: "form-labels", category: "forms", status: unlabeledFields.length ? "fail" : "pass", title: "Form fields have labels", detail: unlabeledFields.length ? `${unlabeledFields.length} form field${unlabeledFields.length === 1 ? " has" : "s have"} no detectable label.` : "All form fields have a detectable label.", count: unlabeledFields.length, examples: examples(unlabeledFields), wcag: ["1.3.1", "3.3.2"] });

  const iframeMissingTitle: string[] = [];
  $("iframe").each((_, el) => { if (!text($(el).attr("title"))) iframeMissingTitle.push($(el).attr("src") || "iframe without src"); });
  add({ id: "iframe-title", category: "media", status: iframeMissingTitle.length ? "fail" : "pass", title: "Embedded frames have titles", detail: iframeMissingTitle.length ? `${iframeMissingTitle.length} iframe${iframeMissingTitle.length === 1 ? " is" : "s are"} missing a title.` : `All ${$("iframe").length} iframes have titles.`, count: iframeMissingTitle.length, examples: examples(iframeMissingTitle), wcag: ["4.1.2"] });

  const videos = $("video").length;
  const videosWithoutCaptions = $("video").filter((_, el) => $(el).find("track[kind='captions']").length === 0).length;
  add({ id: "video-captions", category: "media", status: videosWithoutCaptions ? "warning" : "pass", title: "Video captions are provided", detail: videosWithoutCaptions ? `${videosWithoutCaptions} video element${videosWithoutCaptions === 1 ? " has" : "s have"} no captions track. Confirm external or burned-in captions manually.` : videos ? "Every video element includes a captions track." : "No video elements were found.", count: videosWithoutCaptions, wcag: ["1.2.2"] });

  add({ id: "contrast-manual", category: "images", status: "manual", title: "Color contrast needs visual testing", detail: "Computed styles, states, gradients, images, and custom controls need browser-based contrast testing.", wcag: ["1.4.3", "1.4.11"] });
  add({ id: "keyboard-manual", category: "interaction", status: "manual", title: "Keyboard and focus behavior needs hands-on testing", detail: "Tab order, focus visibility, dialogs, menus, and dynamic updates cannot be verified from static HTML alone.", wcag: ["2.1.1", "2.4.3", "2.4.7"] });
  add({ id: "screen-reader-manual", category: "structure", status: "manual", title: "Assistive technology testing is still required", detail: "Test important journeys with screen readers, zoom, voice input, and disabled users." });

  if (targetLevel === "AAA") {
    add({ id: "aaa-contrast", category: "images", status: "manual", title: "Check enhanced text contrast", detail: "AAA raises normal-text contrast to 7:1 and large-text contrast to 4.5:1, with WCAG exceptions still applying.", wcag: ["1.4.6"] });
    add({ id: "aaa-reading", category: "document", status: "manual", title: "Review reading level and complex language", detail: "Provide plain-language alternatives or supplementary explanations when content requires advanced reading ability.", wcag: ["3.1.5"] });
    add({ id: "aaa-help", category: "forms", status: "manual", title: "Provide contextual help for complex tasks", detail: "Check that instructions and contextual assistance are available where users may need help completing a task.", wcag: ["3.3.5"] });
    add({ id: "aaa-targets", category: "interaction", status: "manual", title: "Check enhanced target size", detail: "Review whether pointer targets meet the enhanced 44 × 44 CSS pixel target-size requirement or a documented exception.", wcag: ["2.5.5"] });
  }

  const automated = results.filter((result) => result.status !== "manual");
  const failed = automated.filter((result) => result.status === "fail").length;
  const warnings = automated.filter((result) => result.status === "warning").length;
  const passed = automated.filter((result) => result.status === "pass").length;
  const score = Math.max(0, Math.round(((passed + warnings * 0.45) / Math.max(automated.length, 1)) * 100));
  return {
    kind: "web", platform: "web", targetLevel, url, finalUrl, pageTitle: pageTitle || finalUrl, scannedAt: new Date().toISOString(), score,
    summary: { passed, warnings, failed, manual: results.length - automated.length, total: results.length },
    results,
    meta: { responseMs, htmlBytes: Buffer.byteLength(html), elementCount: $("*").length }
  };
}

export function analyzeFigmaUrl(raw: string, platform: AuditPlatform = "web", targetLevel: AuditLevel = "AA"): AuditReport {
  const url = new URL(raw);
  if (!(url.hostname === "figma.com" || url.hostname.endsWith(".figma.com"))) throw new Error("Enter a valid Figma share URL.");
  const [, rawType, fileKey, rawName] = url.pathname.split("/");
  const supported = new Set(["design", "file", "proto", "board", "slides", "deck"]);
  if (!supported.has(rawType) || !/^[0-9A-Za-z]{22,128}$/.test(fileKey || "")) throw new Error("This does not look like a supported Figma file, prototype, board, or slides URL.");
  const fileType = rawType === "file" ? "design" : rawType;
  const name = rawName || "Figma file";
  const embed = new URL(`https://embed.figma.com/${fileType}/${fileKey}/${encodeURIComponent(name)}`);
  embed.searchParams.set("embed-host", "a11y-before-handoff");
  const nodeId = url.searchParams.get("node-id") || undefined;
  if (nodeId) embed.searchParams.set("node-id", nodeId);
  if (url.searchParams.get("page-id")) embed.searchParams.set("page-id", url.searchParams.get("page-id")!);
  const title = decodeURIComponent(name).replaceAll("-", " ");
  const manual = (id: string, category: AuditCategory, title: string, detail: string, wcag?: string[]): AuditResult => ({ id, category, status: "manual", title, detail, wcag });
  const platformResults: Record<AuditPlatform, AuditResult[]> = {
    web: [
      manual("platform-web-responsive", "document", "Test responsive reflow and browser zoom", "Review the design at narrow widths, 200% text size, and 400% browser zoom without losing content or controls.", ["1.4.4", "1.4.10"]),
      manual("platform-web-input", "interaction", "Support keyboard, pointer, and voice input", "Every journey should work without a mouse, with visible focus, and with labels that voice-control users can speak.", ["2.1.1", "2.4.7", "2.5.3"])
    ],
    mobile: [
      manual("platform-mobile-text", "document", "Support mobile text and display scaling", "Support iOS Dynamic Type and Android font or display scaling with flexible layouts, readable truncation, and no hidden actions."),
      manual("platform-mobile-screenreader", "structure", "Define a clear mobile screen-reader experience", "Specify labels, roles, states, reading order, grouped content, headings, and custom actions for VoiceOver and TalkBack."),
      manual("platform-mobile-targets", "interaction", "Check touch targets and gesture alternatives", "Respect iOS and Android target-size guidance and provide simple alternatives for complex gestures, drag actions, and motion input.", ["2.5.1", "2.5.8"])
    ]
  };
  const results: AuditResult[] = [
    { id: "figma-url", category: "document", status: "pass", title: "Figma URL format is valid", detail: `Recognized a Figma ${fileType} link with a valid file key.` },
    { id: "figma-node", category: "structure", status: nodeId ? "pass" : "warning", title: "A specific frame or node is linked", detail: nodeId ? `The link targets node ${nodeId}.` : "The link opens the file rather than a specific frame. Link the screen you want reviewers to inspect." },
    manual("figma-public", "document", "Confirm the preview is publicly accessible", "Figma enforces the file's sharing settings inside the embed. If the preview asks for access, update link-sharing in Figma."),
    manual("figma-contrast", "images", "Review text and UI contrast", "Inspect every state, theme, gradient, image background, and non-text control.", ["1.4.3", "1.4.11"]),
    manual("figma-text", "document", "Test text resize and localization", "Check flexible containers, 200% text size, long translations, and right-to-left layouts.", ["1.4.4", "1.4.10"]),
    manual("figma-semantics", "structure", "Annotate names, roles, states, and reading order", "Visual layers do not automatically communicate semantics to engineering or assistive technology.", ["1.3.1", "1.3.2", "4.1.2"]),
    manual("figma-focus", "interaction", "Document keyboard and focus behavior", "Show focus appearance, order, overlay entry and return, keyboard activation, and alternatives to gestures.", ["2.1.1", "2.4.3", "2.4.7"]),
    manual("figma-states", "interaction", "Include all meaningful component states", "Cover focus, pressed, selected, disabled, loading, empty, success, and error states."),
    manual("figma-targets", "interaction", "Check target size and spacing", "Confirm interactive targets are large enough and do not require fine motor precision.", ["2.5.8"]),
    manual("figma-motion", "media", "Specify reduced motion and media alternatives", "Document reduced-motion behavior, pause controls, captions, transcripts, and audio description where relevant.", ["1.2.2", "2.2.2", "2.3.3"]),
    ...platformResults[platform],
    ...(targetLevel === "AAA" ? [
      manual("aaa-contrast", "images", "Check enhanced text contrast", "AAA raises normal-text contrast to 7:1 and large-text contrast to 4.5:1, with WCAG exceptions still applying.", ["1.4.6"]),
      manual("aaa-reading", "document", "Review reading level and complex language", "Plan plain-language alternatives or supplementary explanations for advanced content.", ["3.1.5"]),
      manual("aaa-help", "forms", "Provide contextual help for complex tasks", "Design instructions and contextual assistance where users may need help completing a task.", ["3.3.5"]),
      manual("aaa-targets", "interaction", "Check enhanced target size", "Review whether pointer targets meet the enhanced 44 × 44 CSS pixel target-size requirement or a documented exception.", ["2.5.5"])
    ] : [])
  ];
  return {
    kind: "figma", platform, targetLevel, url: raw, finalUrl: raw, pageTitle: title, scannedAt: new Date().toISOString(), score: null,
    summary: { passed: results.filter((item) => item.status === "pass").length, warnings: results.filter((item) => item.status === "warning").length, failed: 0, manual: results.filter((item) => item.status === "manual").length, total: results.length },
    results, meta: { responseMs: 0, htmlBytes: 0, elementCount: 0 },
    figma: { fileType, fileKey, nodeId, embedUrl: embed.toString() }
  };
}
