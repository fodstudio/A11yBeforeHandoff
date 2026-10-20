import {
  categories,
  categoryTranslations,
  checklist,
  localizeChecklistItem,
  waypointChecklistUrl,
  wcagCriteria,
  wcagUnderstandingUrl,
  type CategoryId,
  type ChecklistItem
} from "@a11y/content";
import type { AnnotationFields, FrameScanSnapshot, PluginToUiMessage, SelectionCheck, SelectionSnapshot, UiToPluginMessage } from "./types";

type Tab = "audit" | "checklist";
type PluginLocale = "en" | "ja";
type Theme = "light" | "dark";
type TextScale = "sm" | "md" | "lg";
type AuditFilter = "all" | SelectionCheck["status"];

const root = document.getElementById("app") || document.body;
const localeKey = "a11y-handoff-plugin-locale";
const themeKey = "a11y-handoff-plugin-theme";
const textScaleKey = "a11y-handoff-plugin-text-scale";
let currentTab: Tab = "audit";
let selection: SelectionSnapshot | null = null;
let frameScan: FrameScanSnapshot | null = null;
let frameScanPending = false;
let checkedIds = new Set<string>();
let expandedCheckIds = new Set<string>();
let annotation: AnnotationFields = { role: "", name: "", state: "", behavior: "" };
let noticeTimer: number | undefined;
let locale: PluginLocale = initialLocale();
let theme: Theme = initialTheme();
let textScale: TextScale = initialTextScale();
let auditFilter: AuditFilter = "all";

const copy: Record<PluginLocale, {
  brand: string;
  tabs: Record<Tab, string>;
  emptyTitle: string;
  emptyText: string;
  reviewed: string;
  saveProgress: string;
  saveChecklist: string;
  waypoint: string;
  waypointFirst: string;
  requirement: string;
  disabilities: string;
  wcagReference: string;
  recommendation: string;
  summaryTitle: string;
  totalResults: string;
  status: Record<"pass" | "review" | "info", string>;
  filters: Record<AuditFilter, string>;
  details: string;
  hideDetails: string;
  noFilteredResults: string;
  annotationTitle: string;
  annotationText: string;
  annotationHelper: string;
  fields: Record<keyof AnnotationFields, { label: string; placeholder: string }>;
  saveOnly: string;
  createAnnotation: string;
  exportTitle: string;
  exportText: string;
  copyMarkdown: string;
  downloadJson: string;
  copied: string;
  disclaimer: string;
  themeLight: string;
  themeDark: string;
  language: string;
  textSize: string;
  textSmall: string;
  textMedium: string;
  textLarge: string;
  checkSelection: string;
  checkAllFrames: string;
  checkingFrames: string;
  frameResults: string;
  frameResultsEmpty: string;
  framesChecked: string;
  layersChecked: string;
  framesLimited: string;
  selectFrame: string;
  noFrameIssues: string;
  issueCount: string;
  manualCount: string;
}> = {
  en: {
    brand: "A11y Checklist",
    tabs: { audit: "Validate", checklist: "Checklist" },
    emptyTitle: "Select one layer",
    emptyText: "Pick a text layer, component, frame, or instance to validate it against the Waypoint checklist.",
    reviewed: "reviewed",
    saveProgress: "Save progress to the selected layer.",
    saveChecklist: "Save checklist to layer",
    waypoint: "Waypoint",
    waypointFirst: "Based on Waypoint. WCAG links are reference only.",
    requirement: "Requirement",
    disabilities: "Disabilities affected",
    wcagReference: "WCAG reference only",
    recommendation: "Recommendation",
    summaryTitle: "Visual summary",
    totalResults: "checks",
    status: { pass: "Okay", review: "Alert", info: "Warning" },
    filters: { all: "All", pass: "Okay", review: "Alert", info: "Warning" },
    details: "Details",
    hideDetails: "Hide",
    noFilteredResults: "No results match this filter.",
    annotationTitle: "Describe the intent",
    annotationText: "Keep details short, specific, and useful to implementation.",
    annotationHelper: "These fields become a black-and-white annotation card beside the selected layer.",
    fields: {
      role: { label: "Role", placeholder: "Button, link, dialog..." },
      name: { label: "Accessible name", placeholder: "The label assistive technology should expose" },
      state: { label: "State", placeholder: "Expanded, selected, invalid..." },
      behavior: { label: "Keyboard & behavior", placeholder: "Focus, activation, announcement..." }
    },
    saveOnly: "Save only",
    createAnnotation: "Create annotation",
    exportTitle: "Portable handoff",
    exportText: "Share the review without locking it inside a plugin.",
    copyMarkdown: "Copy Markdown",
    downloadJson: "Download JSON",
    copied: "Markdown copied.",
    disclaimer: "Automated checks only flag inspectable Figma properties. Waypoint items that depend on meaning, focus behavior, assistive technology output, timing, media, or user testing still require manual review.",
    themeLight: "Light",
    themeDark: "Dark",
    language: "Language",
    textSize: "Text",
    textSmall: "Small",
    textMedium: "Medium",
    textLarge: "Large",
    checkSelection: "Check selection",
    checkAllFrames: "Check all frames",
    checkingFrames: "Checking frames...",
    frameResults: "Current page frames",
    frameResultsEmpty: "No frames found on the current page.",
    framesChecked: "frames checked",
    layersChecked: "layers checked",
    framesLimited: "Showing the first 80 frames on this page.",
    selectFrame: "Select frame",
    noFrameIssues: "No automated frame issues found. Manual review still applies.",
    issueCount: "issues",
    manualCount: "manual"
  },
  ja: {
    brand: "A11yチェックリスト",
    tabs: { audit: "検証", checklist: "チェック" },
    emptyTitle: "レイヤーを1つ選択",
    emptyText: "テキスト、コンポーネント、フレーム、インスタンスを選び、Waypointチェックリストに沿って確認します。",
    reviewed: "確認済み",
    saveProgress: "選択したレイヤーに進捗を保存します。",
    saveChecklist: "レイヤーに保存",
    waypoint: "Waypoint",
    waypointFirst: "Waypoint基準。WCAGリンクは参考です。",
    requirement: "要件",
    disabilities: "影響を受ける障害",
    wcagReference: "WCAG参考リンク",
    recommendation: "改善方法",
    summaryTitle: "概要",
    totalResults: "件",
    status: { pass: "OK", review: "アラート", info: "警告" },
    filters: { all: "すべて", pass: "OK", review: "アラート", info: "警告" },
    details: "詳細",
    hideDetails: "閉じる",
    noFilteredResults: "このフィルターに一致する結果はありません。",
    annotationTitle: "意図を記録",
    annotationText: "実装に役立つよう、短く具体的に書きます。",
    annotationHelper: "入力内容は、選択レイヤーの横に白黒の注釈カードとして作成できます。",
    fields: {
      role: { label: "役割", placeholder: "ボタン、リンク、ダイアログ..." },
      name: { label: "アクセシブル名", placeholder: "支援技術に公開するラベル" },
      state: { label: "状態", placeholder: "展開、選択、エラー..." },
      behavior: { label: "キーボードと動作", placeholder: "フォーカス、実行、通知..." }
    },
    saveOnly: "保存のみ",
    createAnnotation: "注釈を作成",
    exportTitle: "ハンドオフ出力",
    exportText: "プラグイン内に閉じず、レビュー内容を共有します。",
    copyMarkdown: "Markdownをコピー",
    downloadJson: "JSONを書き出す",
    copied: "Markdownをコピーしました。",
    disclaimer: "自動チェックで確認できるのはFigmaから取得できる情報だけです。意味、フォーカス動作、支援技術での出力、時間制限、メディア、ユーザーテストに関わるWaypoint項目は手動確認が必要です。",
    themeLight: "白",
    themeDark: "黒",
    language: "言語",
    textSize: "文字",
    textSmall: "小",
    textMedium: "中",
    textLarge: "大",
    checkSelection: "選択をチェック",
    checkAllFrames: "全フレームをチェック",
    checkingFrames: "フレームを確認中...",
    frameResults: "現在ページのフレーム",
    frameResultsEmpty: "現在のページにフレームがありません。",
    framesChecked: "フレーム確認",
    layersChecked: "レイヤー確認",
    framesLimited: "このページの最初の80フレームを表示しています。",
    selectFrame: "フレームを選択",
    noFrameIssues: "自動で検出できるフレームの問題はありません。手動確認は必要です。",
    issueCount: "問題",
    manualCount: "手動"
  }
};

function initialLocale(): PluginLocale {
  const saved = safeStorageGet(localeKey);
  if (saved === "ja" || saved === "en") return saved;
  return navigator.language && navigator.language.indexOf("ja") === 0 ? "ja" : "en";
}

function initialTheme(): Theme {
  const saved = safeStorageGet(themeKey);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initialTextScale(): TextScale {
  const saved = safeStorageGet(textScaleKey);
  if (saved === "sm" || saved === "lg" || saved === "md") return saved;
  return "md";
}

function safeStorageGet(key: string) {
  try {
    return window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string) {
  try {
    if (window.localStorage) window.localStorage.setItem(key, value);
  } catch {
    // Figma may block storage in some plugin iframe sessions. Preferences can still work for the current run.
  }
}

function applyPreferences() {
  document.documentElement.lang = locale;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.textScale = textScale;
  document.documentElement.style.colorScheme = theme;
  safeStorageSet(localeKey, locale);
  safeStorageSet(themeKey, theme);
  safeStorageSet(textScaleKey, textScale);
}

function send(message: UiToPluginMessage) {
  try {
    parent.postMessage({ pluginMessage: message }, "*");
  } catch {
    showFatalError("The plugin UI loaded, but Figma messaging is unavailable. Close and reopen the plugin.");
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
}

function categoryLabel(id: CategoryId) {
  if (locale === "ja") return categoryTranslations.ja[id];
  return categories.find((category) => category.id === id)!;
}

function itemCopy(item: ChecklistItem) {
  return localizeChecklistItem(item, locale);
}

function statusMark(status: SelectionCheck["status"]) {
  if (status === "pass") return "✓";
  if (status === "review") return "!";
  return "i";
}

function renderAuditFilter(checks: SelectionCheck[]) {
  const filters: AuditFilter[] = ["all", "review", "info", "pass"];
  const countFor = (filter: AuditFilter) => filter === "all" ? checks.length : checks.filter((check) => check.status === filter).length;
  return `<div class="audit-filter" aria-label="Result filter">${filters.map((filter) => `<button type="button" class="${auditFilter === filter ? "active" : ""}" data-audit-filter="${filter}"><span>${copy[locale].filters[filter]}</span><strong>${countFor(filter)}</strong></button>`).join("")}</div>`;
}

function sortChecksByPriority(checks: SelectionCheck[]) {
  const priority: Record<SelectionCheck["status"], number> = { review: 0, info: 1, pass: 2 };
  return checks.slice().sort((first, second) => priority[first.status] - priority[second.status]);
}

function statusCounts(checks: SelectionCheck[]) {
  return {
    review: checks.filter((check) => check.status === "review").length,
    info: checks.filter((check) => check.status === "info").length,
    pass: checks.filter((check) => check.status === "pass").length
  };
}

function statusPercent(count: number, total: number) {
  return total > 0 ? Math.round(count / total * 100) : 0;
}

function renderStatusGraphic(checks: SelectionCheck[]) {
  const counts = statusCounts(checks);
  const total = checks.length;
  const mainStatus: SelectionCheck["status"] = counts.review > 0 ? "review" : counts.info > 0 ? "info" : "pass";
  const alertSize = statusPercent(counts.review, total);
  const warningSize = statusPercent(counts.info, total);
  const okaySize = statusPercent(counts.pass, total);
  return `<section class="status-graphic status-${mainStatus}" aria-label="${copy[locale].summaryTitle}">
    <div class="status-orb" aria-hidden="true"><strong>${counts[mainStatus]}</strong><span>${copy[locale].status[mainStatus]}</span></div>
    <div class="status-chart">
      <div class="status-chart-head"><strong>${total}</strong><span>${copy[locale].totalResults}</span>${linkButton("Waypoint", waypointChecklistUrl)}</div>
      <div class="status-stack" aria-hidden="true">
        <span class="stack-alert" style="width:${alertSize}%"></span>
        <span class="stack-warning" style="width:${warningSize}%"></span>
        <span class="stack-okay" style="width:${okaySize}%"></span>
      </div>
      <div class="status-legend">
        <span class="legend-alert"><i></i><strong>${counts.review}</strong>${copy[locale].filters.review}</span>
        <span class="legend-warning"><i></i><strong>${counts.info}</strong>${copy[locale].filters.info}</span>
        <span class="legend-okay"><i></i><strong>${counts.pass}</strong>${copy[locale].filters.pass}</span>
      </div>
    </div>
  </section>`;
}

function renderAuditCard(check: SelectionCheck) {
  const expanded = expandedCheckIds.has(check.id);
  const summary = check.recommendation || check.detail;
  return `<article class="audit-card status-${check.status}">
      <div class="audit-head"><span class="status" aria-hidden="true">${statusMark(check.status)}</span><div><p>${copy[locale].status[check.status]}</p><h3>${escapeHtml(check.title)}</h3></div></div>
      <p class="audit-summary">${escapeHtml(summary)}</p>
      <button type="button" class="detail-toggle" data-toggle-check="${escapeHtml(check.id)}">${expanded ? copy[locale].hideDetails : copy[locale].details}</button>
      ${expanded ? `<div class="audit-details">
        ${check.recommendation ? `<div class="recommendation"><span>${copy[locale].recommendation}</span>${escapeHtml(check.recommendation)}</div><p>${escapeHtml(check.detail)}</p>` : `<p>${escapeHtml(check.detail)}</p>`}
        ${waypointReference(check)}
        ${wcagLinks(check.wcag)}
      </div>` : ""}
    </article>`;
}

function linkButton(label: string, url: string) {
  return `<button type="button" class="text-link" data-link="${escapeHtml(url)}">${escapeHtml(label)} <span aria-hidden="true">↗</span></button>`;
}

function wcagLinks(criteria: string[] | undefined) {
  if (!criteria || !criteria.length) return "";
  return `<div class="reference-row"><span>${copy[locale].wcagReference}</span>${criteria.map((criterion) => {
    const reference = wcagCriteria[criterion];
    const label = `WCAG ${criterion}${reference ? ` ${reference.level}` : ""}`;
    return linkButton(label, wcagUnderstandingUrl(criterion));
  }).join("")}</div>`;
}

function renderFrameScan() {
  if (frameScanPending) return `<section class="frame-scan"><h2>${copy[locale].checkingFrames}</h2><div class="progress indeterminate"><span></span></div></section>`;
  if (!frameScan) return "";
  if (!frameScan.frames.length) return `<section class="frame-scan"><h2>${copy[locale].frameResults}</h2><p>${copy[locale].frameResultsEmpty}</p></section>`;

  return `<section class="frame-scan">
    <div class="frame-scan-head"><div><h2>${copy[locale].frameResults}</h2><p>${escapeHtml(frameScan.pageName)}</p></div><span>${frameScan.frameCount} ${copy[locale].framesChecked}</span></div>
    <div class="frame-scan-meta"><span>${frameScan.checkedLayerCount} ${copy[locale].layersChecked}</span>${frameScan.truncated ? `<span>${copy[locale].framesLimited}</span>` : ""}</div>
    <div class="frame-list">${frameScan.frames.map((frame) => {
      const status = frame.reviewCount > 0 ? "review" : "pass";
      const size = frame.width !== null && frame.height !== null ? `${frame.width} x ${frame.height} px` : frame.type;
      const visibleChecks = frame.checks.filter((check) => check.status !== "pass").slice(0, 4);
      return `<article class="frame-card status-${status}">
        <div class="frame-card-head"><div><h3>${escapeHtml(frame.name)}</h3><p>${escapeHtml(size)} - ${frame.layerCount + 1} ${copy[locale].layersChecked}</p></div><button type="button" class="secondary small" data-select-node="${escapeHtml(frame.nodeId)}">${copy[locale].selectFrame}</button></div>
        <div class="frame-counts"><span>${frame.reviewCount} ${copy[locale].issueCount}</span><span>${frame.manualCount} ${copy[locale].manualCount}</span></div>
        ${visibleChecks.length ? `<div class="frame-findings">${visibleChecks.map((check) => `<div><strong>${escapeHtml(check.title)}</strong></div>`).join("")}</div>` : `<p class="frame-empty">${copy[locale].noFrameIssues}</p>`}
      </article>`;
    }).join("")}</div>
  </section>`;
}

function waypointReference(check: Pick<SelectionCheck, "waypoint" | "disabilities">) {
  if (!check.waypoint) return "";
  const disabilities = check.disabilities && check.disabilities.length ? `<div class="meta-line"><span>${copy[locale].disabilities}</span><strong>${escapeHtml(check.disabilities.join(", "))}</strong></div>` : "";
  return `<div class="waypoint-box">
      <div class="meta-line"><span>${copy[locale].waypoint}</span><strong>${escapeHtml(check.waypoint.section)}</strong></div>
      <div class="meta-line"><span>${copy[locale].requirement}</span><strong>${escapeHtml(check.waypoint.requirement)}</strong></div>
      ${disabilities}
      ${linkButton(locale === "ja" ? "Waypointで開く" : "Open Waypoint", check.waypoint.url)}
    </div>`;
}

function checklistReference(item: ChecklistItem, inputId: string) {
  const localized = itemCopy(item);
  const waypoint = item.waypoint ? waypointReference({
    waypoint: {
      section: item.waypoint.section,
      requirement: item.waypoint.requirement,
      url: item.waypoint.url
    },
    disabilities: item.waypoint.disabilities
  }) : "";
  return `<div class="check-copy"><label for="${inputId}"><strong>${escapeHtml(localized.title)}</strong><small>${escapeHtml(localized.prompt)}</small></label>${waypoint}${wcagLinks(item.wcag)}</div>`;
}

function reviewedCount() {
  return checklist.filter((item) => checkedIds.has(item.id)).length;
}

function reportMarkdown() {
  if (!selection || !selection.nodeId) return locale === "ja" ? "レイヤーを1つ選択してください。" : "Select one layer to create a handoff report.";
  const completed = checklist.filter((item) => checkedIds.has(item.id));
  const remaining = checklist.filter((item) => !checkedIds.has(item.id));
  const lines = locale === "ja" ? [
    `# アクセシビリティハンドオフ - ${selection.name}`,
    "",
    `- レイヤー種別: ${selection.type}`,
    `- 確認済み: ${completed.length}/${checklist.length}`,
    `- 基準: Waypoint Accessibility Checklist first; WCAG reference only`,
    "",
    "## 注釈",
    "",
    `- 役割: ${annotation.role || "未定義"}`,
    `- アクセシブル名: ${annotation.name || "未定義"}`,
    `- 状態: ${annotation.state || "未定義"}`,
    `- 動作: ${annotation.behavior || "未定義"}`,
    "",
    "## 確認済み",
    "",
    ...(completed.length ? completed.map((item) => `- [x] ${itemCopy(item).title}`) : ["- まだ確認していません"]),
    "",
    "## これから確認",
    "",
    ...remaining.map((item) => `- [ ] ${itemCopy(item).title}`),
    "",
    "> このチェックリストはデザインレビューの補助です。WCAG適合証明ではなく、手動確認と支援技術での確認が必要です。"
  ] : [
    `# Accessibility handoff - ${selection.name}`,
    "",
    `- Layer type: ${selection.type}`,
    `- Reviewed: ${completed.length}/${checklist.length}`,
    `- Basis: Waypoint Accessibility Checklist first; WCAG reference only`,
    "",
    "## Annotation",
    "",
    `- Role: ${annotation.role || "Needs definition"}`,
    `- Accessible name: ${annotation.name || "Needs definition"}`,
    `- State: ${annotation.state || "Needs definition"}`,
    `- Behavior: ${annotation.behavior || "Needs definition"}`,
    "",
    "## Reviewed",
    "",
    ...(completed.length ? completed.map((item) => `- [x] ${item.title}`) : ["- Nothing reviewed yet"]),
    "",
    "## Still to review",
    "",
    ...remaining.map((item) => `- [ ] ${item.title}`),
    "",
    "> This checklist supports design review. It is not proof of WCAG conformance or a substitute for testing with disabled people."
  ];
  return lines.join("\n");
}

function renderAudit() {
  const actions = `<div class="scan-actions"><button type="button" class="secondary" data-action="scan-selection">${copy[locale].checkSelection}</button><button type="button" class="primary" data-action="scan-all-frames">${copy[locale].checkAllFrames}</button></div>`;
  if (!selection || !selection.nodeId) return `${actions}<div class="empty"><span aria-hidden="true">A11y</span><h2>${copy[locale].emptyTitle}</h2><p>${copy[locale].emptyText}</p></div>${renderFrameScan()}`;
  const dimensions = selection.width !== null && selection.height !== null ? `<span>${selection.width} x ${selection.height} px</span>` : "";
  const visibleChecks = sortChecksByPriority(auditFilter === "all" ? selection.checks : selection.checks.filter((check) => check.status === auditFilter));
  return `${actions}${renderStatusGraphic(selection.checks)}
    <div class="selection-meta"><span>${escapeHtml(selection.type)}</span>${dimensions}</div>
    ${renderAuditFilter(selection.checks)}
    <div class="audit-list">${visibleChecks.length ? visibleChecks.map((check) => renderAuditCard(check)).join("") : `<p class="empty-filter">${copy[locale].noFilteredResults}</p>`}</div>
    ${renderFrameScan()}`;
}

function renderChecklist() {
  if (!selection || !selection.nodeId) return renderAudit();
  const completed = reviewedCount();
  return `<div class="intro"><div><h1>${completed}/${checklist.length} ${copy[locale].reviewed}</h1><p>${copy[locale].saveProgress}</p></div></div><div class="progress" aria-label="${completed} of ${checklist.length} reviewed"><span style="width:${Math.round(completed / checklist.length * 100)}%"></span></div>
    <div class="checklist-groups">${categories.map((category) => {
      const label = categoryLabel(category.id);
      const items = checklist.filter((item) => item.category === category.id);
      return `<section class="checklist-group"><h2>${escapeHtml(label.label)}</h2><p>${escapeHtml(label.description)}</p>${items.map((item) => {
        const inputId = `check-${item.id}`;
        return `<div class="manual-check"><input id="${inputId}" type="checkbox" data-check-id="${item.id}" ${checkedIds.has(item.id) ? "checked" : ""}>${checklistReference(item, inputId)}</div>`;
      }).join("")}</section>`;
    }).join("")}</div><div class="sticky-actions"><button class="primary full" data-action="save-checklist">${copy[locale].saveChecklist}</button></div>`;
}

function field(name: keyof AnnotationFields, multiline = false) {
  const value = escapeHtml(annotation[name]);
  const text = copy[locale].fields[name];
  return `<div class="field"><label for="${name}">${text.label}</label>${multiline ? `<textarea id="${name}" data-field="${name}" placeholder="${text.placeholder}">${value}</textarea>` : `<input id="${name}" data-field="${name}" value="${value}" placeholder="${text.placeholder}">`}</div>`;
}

function renderAnnotation() {
  if (!selection || !selection.nodeId) return renderAudit();
  return `<div class="intro"><div><h1>${copy[locale].annotationTitle}</h1><p>${copy[locale].annotationText}</p></div></div><div class="helper">${copy[locale].annotationHelper}</div>
    ${field("role")}${field("name")}${field("state")}${field("behavior", true)}
    <div class="sticky-actions"><button class="secondary" data-action="save-annotation">${copy[locale].saveOnly}</button><button class="primary" data-action="create-annotation">${copy[locale].createAnnotation}</button></div>`;
}

function renderExport() {
  if (!selection || !selection.nodeId) return renderAudit();
  return `<div class="intro"><div><h1>${copy[locale].exportTitle}</h1><p>${copy[locale].exportText}</p></div></div><pre class="export-preview">${escapeHtml(reportMarkdown())}</pre><div class="action-grid"><button class="secondary" data-action="copy-markdown">${copy[locale].copyMarkdown}</button><button class="primary" data-action="download-json">${copy[locale].downloadJson}</button></div>`;
}

function render() {
  applyPreferences();
  const tabs = copy[locale].tabs;
  const content = currentTab === "audit" ? renderAudit() : renderChecklist();
  const selectedName = selection ? selection.name : copy[locale].emptyTitle;
  root.innerHTML = `<div class="shell"><header class="topbar"><div class="brand"><span class="mark" aria-hidden="true">A11y</span><span>${copy[locale].brand}</span></div><span class="selection-pill" title="${escapeHtml(selectedName)}">${escapeHtml(selectedName)}</span></header>
    <div class="toolbar" aria-label="Preferences"><label><span>${copy[locale].language}</span><select data-locale><option value="en" ${locale === "en" ? "selected" : ""}>EN</option><option value="ja" ${locale === "ja" ? "selected" : ""}>日本語</option></select></label><label><span>${copy[locale].textSize}</span><select data-text-scale><option value="sm" ${textScale === "sm" ? "selected" : ""}>${copy[locale].textSmall}</option><option value="md" ${textScale === "md" ? "selected" : ""}>${copy[locale].textMedium}</option><option value="lg" ${textScale === "lg" ? "selected" : ""}>${copy[locale].textLarge}</option></select></label><button type="button" class="theme-button" data-action="toggle-theme">${theme === "light" ? copy[locale].themeDark : copy[locale].themeLight}</button></div>
    <nav class="tabs" aria-label="Plugin sections">${(Object.keys(tabs) as Tab[]).map((tab) => `<button class="${currentTab === tab ? "active" : ""}" data-tab="${tab}">${tabs[tab]}</button>`).join("")}</nav><main class="panel">${content}</main></div>`;
}

function showNotice(message: string, tone: "success" | "warning") {
  const current = document.querySelector(".toast");
  if (current) current.remove();
  const element = document.createElement("div");
  element.className = `toast ${tone}`;
  element.setAttribute("role", tone === "warning" ? "alert" : "status");
  element.textContent = message;
  document.body.appendChild(element);
  if (noticeTimer) window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => element.remove(), 2600);
}

function showFatalError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "Unknown plugin error");
  root.innerHTML = `<div class="fatal"><h1>Plugin could not start</h1><p>${escapeHtml(message)}</p><button type="button" data-action="reload-ui">Reload</button></div>`;
}

root.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;
  const link = target.closest<HTMLButtonElement>("[data-link]");
  if (link) {
    event.preventDefault();
    event.stopPropagation();
    const url = link.dataset.link;
    if (url) send({ type: "open-link", url });
    return;
  }
  const selectButton = target.closest<HTMLButtonElement>("[data-select-node]");
  if (selectButton) {
    const nodeId = selectButton.dataset.selectNode;
    if (nodeId) send({ type: "select-node", nodeId });
    return;
  }
  const filterButton = target.closest<HTMLButtonElement>("[data-audit-filter]");
  if (filterButton) {
    const filter = filterButton.dataset.auditFilter;
    auditFilter = filter === "pass" || filter === "review" || filter === "info" ? filter : "all";
    render();
    return;
  }
  const toggleButton = target.closest<HTMLButtonElement>("[data-toggle-check]");
  if (toggleButton) {
    const id = toggleButton.dataset.toggleCheck;
    if (id && expandedCheckIds.has(id)) expandedCheckIds.delete(id);
    else if (id) expandedCheckIds.add(id);
    render();
    return;
  }
  const tabButton = target.closest<HTMLButtonElement>("[data-tab]");
  if (tabButton) { currentTab = tabButton.dataset.tab as Tab; render(); return; }
  const actionButton = target.closest<HTMLButtonElement>("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (action === "reload-ui") {
    window.location.reload();
    return;
  }
  if (action === "toggle-theme") {
    theme = theme === "light" ? "dark" : "light";
    render();
  }
  if (action === "scan-selection") {
    send({ type: "scan" });
  }
  if (action === "scan-all-frames") {
    frameScanPending = true;
    render();
    send({ type: "scan-all-frames" });
  }
  if (action === "save-checklist") send({ type: "save-checklist", ids: [...checkedIds] });
  if (action === "save-annotation") send({ type: "save-annotation", annotation });
  if (action === "create-annotation") send({ type: "create-annotation", annotation });
  if (action === "copy-markdown") {
    await navigator.clipboard.writeText(reportMarkdown());
    showNotice(copy[locale].copied, "success");
  }
  if (action === "download-json" && selection) {
    const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), source: "Waypoint Accessibility Checklist", wcagUse: "reference-only", selection: { name: selection.name, type: selection.type }, annotation, reviewedChecklistIds: [...checkedIds] }, null, 2);
    const linkElement = document.createElement("a");
    linkElement.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    linkElement.download = `${selection.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-a11y-handoff.json`;
    linkElement.click();
    URL.revokeObjectURL(linkElement.href);
  }
});

root.addEventListener("change", (event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  if (target instanceof HTMLSelectElement && target.dataset.locale !== undefined) {
    locale = target.value === "ja" ? "ja" : "en";
    render();
    return;
  }
  if (target instanceof HTMLSelectElement && target.dataset.textScale !== undefined) {
    textScale = target.value === "lg" ? "lg" : target.value === "sm" ? "sm" : "md";
    render();
    return;
  }
  if (target instanceof HTMLInputElement && target.dataset.checkId) {
    target.checked ? checkedIds.add(target.dataset.checkId) : checkedIds.delete(target.dataset.checkId);
    render();
  }
});

root.addEventListener("input", (event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  const key = target.dataset.field as keyof AnnotationFields | undefined;
  if (key) annotation[key] = target.value;
});

window.onerror = (_event, _source, _lineno, _colno, error) => {
  showFatalError(error || "Unexpected plugin UI error.");
};

window.onunhandledrejection = (event) => {
  showFatalError(event.reason || "Unexpected plugin UI error.");
};

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginToUiMessage }>) => {
  try {
    const message = event.data.pluginMessage;
    if (!message) return;
    if (message.type === "selection") {
      selection = message.payload;
      expandedCheckIds = new Set();
      checkedIds = new Set(selection.savedChecklistIds);
      annotation = selection.annotation || { role: "", name: "", state: "", behavior: "" };
      render();
    }
    if (message.type === "frame-scan") {
      frameScan = message.payload;
      frameScanPending = false;
      render();
    }
    if (message.type === "notice") showNotice(message.message, message.tone);
  } catch (error) {
    showFatalError(error);
  }
};

try {
  render();
  send({ type: "scan" });
} catch (error) {
  showFatalError(error);
}
