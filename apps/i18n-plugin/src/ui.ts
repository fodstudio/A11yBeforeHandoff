import type { ScanOptions, ScanResponse, TargetLocale } from "./types";

const app = document.querySelector<HTMLDivElement>("#app")!;
const presets: Array<{ value: TargetLocale; label: string; expansion: number }> = [
  { value: "de", label: "German", expansion: 30 }, { value: "fi", label: "Finnish", expansion: 35 },
  { value: "fr", label: "French", expansion: 20 }, { value: "es", label: "Spanish", expansion: 25 },
  { value: "ja", label: "Japanese", expansion: 10 }, { value: "ko", label: "Korean", expansion: 15 },
  { value: "ar", label: "Arabic · RTL", expansion: 30 }, { value: "pseudo", label: "Pseudo locale", expansion: 40 }
];

let selectedName = "Nothing selected";
let selectedTextCount = 0;
let options: ScanOptions = { locale: "de", expansion: 30 };
let report: ScanResponse | null = null;
let notice = "";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

function resultRows() {
  if (!report) return `<div class="empty"><strong>Ready when you are.</strong><p>Select a frame and run a check. Your design stays inside Figma.</p></div>`;
  if (!report.results.length) return `<div class="empty"><strong>No text layers found.</strong><p>Select a frame, group, component, or text layer that contains visible copy.</p></div>`;
  return report.results.map((item) => `
    <article class="result result-${item.status}">
      <header><span>${item.status}</span><strong>${escapeHtml(item.nodeName)}</strong><small>${item.characters} → ~${item.estimatedCharacters} chars</small></header>
      <p class="original">${escapeHtml(item.original)}</p>
      <p class="preview" ${options.locale === "ar" ? 'dir="rtl"' : ""}>${escapeHtml(item.preview)}</p>
      ${item.reasons.length ? `<ul>${item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>` : `<p class="okay">No obvious layout risk detected. Review the preview in context.</p>`}
    </article>`).join("");
}

function render() {
  const risky = report?.results.filter((item) => item.status === "risk").length || 0;
  const review = report?.results.filter((item) => item.status === "review").length || 0;
  app.innerHTML = `
    <header class="top"><div class="mark">I18n</div><div><strong>Handoff</strong><span>Localization stress test</span></div></header>
    <section class="selection"><span>Selection</span><strong>${escapeHtml(selectedName)}</strong><small>${selectedTextCount} text layer${selectedTextCount === 1 ? "" : "s"}</small></section>
    <section class="controls">
      <label>Target locale<select id="locale">${presets.map((preset) => `<option value="${preset.value}" ${preset.value === options.locale ? "selected" : ""}>${preset.label}</option>`).join("")}</select></label>
      <label>Text expansion<div class="range-row"><input id="expansion" type="range" min="0" max="60" step="5" value="${options.expansion}"><output>${options.expansion}%</output></div></label>
      <div class="actions"><button class="primary" id="scan" ${selectedTextCount ? "" : "disabled"}>Check selection</button><button id="preview" ${selectedTextCount ? "" : "disabled"}>Duplicate preview</button></div>
      <p class="hint">Duplicate preview never changes your original selection.</p>
    </section>
    ${notice ? `<div class="notice" role="status">${escapeHtml(notice)}</div>` : ""}
    ${report ? `<section class="summary"><strong>${report.textLayers}</strong><span>text layers</span><strong>${risky}</strong><span>layout risks</span><strong>${review}</strong><span>review</span><button id="export">Export CSV</button></section>` : ""}
    <main class="results">${resultRows()}</main>
    <footer>Local only · No design data leaves Figma</footer>`;

  app.querySelector<HTMLSelectElement>("#locale")?.addEventListener("change", (event) => {
    const preset = presets.find((item) => item.value === (event.target as HTMLSelectElement).value)!;
    options = { locale: preset.value, expansion: preset.expansion }; report = null; notice = ""; render();
  });
  app.querySelector<HTMLInputElement>("#expansion")?.addEventListener("input", (event) => {
    options.expansion = Number((event.target as HTMLInputElement).value); render();
  });
  app.querySelector("#scan")?.addEventListener("click", () => parent.postMessage({ pluginMessage: { type: "scan", options } }, "*"));
  app.querySelector("#preview")?.addEventListener("click", () => parent.postMessage({ pluginMessage: { type: "create-preview", options } }, "*"));
  app.querySelector("#export")?.addEventListener("click", exportCsv);
}

function exportCsv() {
  if (!report) return;
  const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = [["Layer", "Original", "Preview", "Characters", "Estimated characters", "Status", "Reasons"], ...report.results.map((item) => [item.nodeName, item.original, item.preview, item.characters, item.estimatedCharacters, item.status, item.reasons.join("; ")])];
  const blob = new Blob([rows.map((row) => row.map(quote).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "i18n-handoff-report.csv"; link.click(); URL.revokeObjectURL(link.href);
}

window.onmessage = (event) => {
  const message = event.data.pluginMessage;
  if (message?.type === "selection") { selectedName = message.name; selectedTextCount = message.count; report = null; notice = ""; }
  if (message?.type === "scan-result") { report = message.payload; notice = "Check complete."; }
  if (message?.type === "preview-created") notice = `Created ${message.count} duplicate preview${message.count === 1 ? "" : "s"}.`;
  if (message?.type === "error") notice = message.message;
  render();
};

render();
