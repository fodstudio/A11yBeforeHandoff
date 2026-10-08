import { categories, checklist } from "@a11y/content";
import type { AnnotationFields, PluginToUiMessage, SelectionSnapshot, UiToPluginMessage } from "./types";

type Tab = "audit" | "checklist" | "annotation" | "export";

const root = document.getElementById("app")!;
let currentTab: Tab = "audit";
let selection: SelectionSnapshot | null = null;
let checkedIds = new Set<string>();
let annotation: AnnotationFields = { role: "", name: "", state: "", behavior: "" };
let noticeTimer: number | undefined;

function send(message: UiToPluginMessage) {
  parent.postMessage({ pluginMessage: message }, "*");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
}

function reportMarkdown() {
  if (!selection?.nodeId) return "Select one layer to create a handoff report.";
  const completed = checklist.filter((item) => checkedIds.has(item.id));
  const remaining = checklist.filter((item) => !checkedIds.has(item.id));
  return [
    `# Accessibility handoff — ${selection.name}`,
    "",
    `- Layer type: ${selection.type}`,
    `- Reviewed: ${completed.length}/${checklist.length}`,
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
  ].join("\n");
}

function renderAudit() {
  if (!selection?.nodeId) return `<div class="empty"><span aria-hidden="true">⌁</span><h2>Select one layer</h2><p>Pick a text layer, component, frame, or instance to begin a lightweight review.</p></div>`;
  return `<div class="selection-meta"><span>${escapeHtml(selection.type)}</span>${selection.width !== null ? `<span>${selection.width} × ${selection.height} px</span>` : ""}</div>
    <div class="audit-list">${selection.checks.map((check) => `<article class="audit-card"><span class="status status-${check.status}" aria-hidden="true">${check.status === "pass" ? "✓" : check.status === "review" ? "!" : "i"}</span><div><h3>${escapeHtml(check.title)}</h3><p>${escapeHtml(check.detail)}</p></div></article>`).join("")}</div>
    <p class="disclaimer">Automated checks only flag inspectable properties. They cannot determine meaning, context, WCAG conformance, or usability.</p>`;
}

function renderChecklist() {
  if (!selection?.nodeId) return renderAudit();
  const completed = checkedIds.size;
  return `<div class="intro"><div><h1>${completed}/${checklist.length} reviewed</h1><p>Save progress to the selected layer.</p></div></div><div class="progress" aria-label="${completed} of ${checklist.length} reviewed"><span style="width:${Math.round(completed / checklist.length * 100)}%"></span></div>
    <div class="checklist-groups">${categories.map((category) => {
      const items = checklist.filter((item) => item.category === category.id);
      return `<section class="checklist-group"><h2>${escapeHtml(category.label)}</h2>${items.map((item) => `<label class="manual-check"><input type="checkbox" data-check-id="${item.id}" ${checkedIds.has(item.id) ? "checked" : ""}><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.prompt)}</small></span></label>`).join("")}</section>`;
    }).join("")}</div><div class="sticky-actions"><button class="primary full" data-action="save-checklist">Save checklist to layer</button></div>`;
}

function field(name: keyof AnnotationFields, label: string, placeholder: string, multiline = false) {
  const value = escapeHtml(annotation[name]);
  return `<div class="field"><label for="${name}">${label}</label>${multiline ? `<textarea id="${name}" data-field="${name}" placeholder="${placeholder}">${value}</textarea>` : `<input id="${name}" data-field="${name}" value="${value}" placeholder="${placeholder}">`}</div>`;
}

function renderAnnotation() {
  if (!selection?.nodeId) return renderAudit();
  return `<div class="intro"><div><h1>Describe the intent</h1><p>Keep details short, specific, and useful to implementation.</p></div></div><div class="helper">These fields become a bright annotation card beside the selected layer.</div>
    ${field("role", "Role", "Button, link, dialog…")}${field("name", "Accessible name", "The label assistive technology should expose")}${field("state", "State", "Expanded, selected, invalid…")}${field("behavior", "Keyboard & behavior", "Focus, activation, announcement…", true)}
    <div class="sticky-actions"><button class="secondary" data-action="save-annotation">Save only</button><button class="primary" data-action="create-annotation">Create annotation</button></div>`;
}

function renderExport() {
  if (!selection?.nodeId) return renderAudit();
  return `<div class="intro"><div><h1>Portable handoff</h1><p>Share the review without locking it inside a plugin.</p></div></div><pre class="export-preview">${escapeHtml(reportMarkdown())}</pre><div class="action-grid"><button class="secondary" data-action="copy-markdown">Copy Markdown</button><button class="primary" data-action="download-json">Download JSON</button></div>`;
}

function render() {
  const labels: Record<Tab, string> = { audit: "Audit", checklist: "Checklist", annotation: "Annotate", export: "Export" };
  const content = currentTab === "audit" ? renderAudit() : currentTab === "checklist" ? renderChecklist() : currentTab === "annotation" ? renderAnnotation() : renderExport();
  root.innerHTML = `<div class="shell"><header class="topbar"><div class="brand"><span class="mark">A11y</span><span>Before Handoff</span></div><span class="selection-pill" title="${escapeHtml(selection?.name || "Nothing selected")}">${escapeHtml(selection?.name || "Nothing selected")}</span></header>
    <nav class="tabs" aria-label="Plugin sections">${(Object.keys(labels) as Tab[]).map((tab) => `<button class="${currentTab === tab ? "active" : ""}" data-tab="${tab}">${labels[tab]}</button>`).join("")}</nav><main class="panel">${content}</main></div>`;
}

function showNotice(message: string, tone: "success" | "warning") {
  document.querySelector(".toast")?.remove();
  const element = document.createElement("div");
  element.className = `toast ${tone}`;
  element.setAttribute("role", tone === "warning" ? "alert" : "status");
  element.textContent = message;
  document.body.appendChild(element);
  if (noticeTimer) window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => element.remove(), 2600);
}

root.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;
  const tabButton = target.closest<HTMLButtonElement>("[data-tab]");
  if (tabButton) { currentTab = tabButton.dataset.tab as Tab; render(); return; }
  const actionButton = target.closest<HTMLButtonElement>("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (action === "save-checklist") send({ type: "save-checklist", ids: [...checkedIds] });
  if (action === "save-annotation") send({ type: "save-annotation", annotation });
  if (action === "create-annotation") send({ type: "create-annotation", annotation });
  if (action === "copy-markdown") {
    await navigator.clipboard.writeText(reportMarkdown());
    showNotice("Markdown copied.", "success");
  }
  if (action === "download-json" && selection) {
    const data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), selection: { name: selection.name, type: selection.type }, annotation, reviewedChecklistIds: [...checkedIds] }, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    link.download = `${selection.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-a11y-handoff.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
});

root.addEventListener("change", (event) => {
  const target = event.target as HTMLInputElement;
  if (target.dataset.checkId) {
    target.checked ? checkedIds.add(target.dataset.checkId) : checkedIds.delete(target.dataset.checkId);
    render();
  }
});

root.addEventListener("input", (event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  const key = target.dataset.field as keyof AnnotationFields | undefined;
  if (key) annotation[key] = target.value;
});

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginToUiMessage }>) => {
  const message = event.data.pluginMessage;
  if (!message) return;
  if (message.type === "selection") {
    selection = message.payload;
    checkedIds = new Set(selection.savedChecklistIds);
    annotation = selection.annotation || { role: "", name: "", state: "", behavior: "" };
    render();
  }
  if (message.type === "notice") showNotice(message.message, message.tone);
};

render();
send({ type: "scan" });
