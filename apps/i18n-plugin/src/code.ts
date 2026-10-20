import type { PluginMessage, ScanOptions, ScanResponse, ScanResult } from "./types";

figma.showUI(__html__, { width: 500, height: 720, themeColors: true });

const accentMap: Record<string, string> = {
  a: "á", b: "ƀ", c: "ç", d: "ð", e: "ë", f: "ƒ", g: "ğ", h: "ħ", i: "ï", j: "ĵ", k: "ķ", l: "ľ", m: "ɱ",
  n: "ñ", o: "ö", p: "þ", q: "ɋ", r: "ř", s: "š", t: "ŧ", u: "ü", v: "ṽ", w: "ŵ", x: "ẋ", y: "ÿ", z: "ž"
};

function pseudoLocalize(value: string, expansion: number, rtl = false) {
  const transformed = value.replace(/[A-Za-z]/g, (letter) => {
    const mapped = accentMap[letter.toLowerCase()] || letter;
    return letter === letter.toUpperCase() ? mapped.toUpperCase() : mapped;
  });
  const visibleLetters = value.replace(/\s/g, "").length;
  const padding = " ~".repeat(Math.max(0, Math.ceil((visibleLetters * expansion) / 200)));
  const output = `⟦${transformed}${padding}⟧`;
  return rtl ? `\u200F${output}` : output;
}

function textNodesFor(node: SceneNode): TextNode[] {
  if (node.type === "TEXT") return [node];
  if ("findAllWithCriteria" in node) return node.findAllWithCriteria({ types: ["TEXT"] });
  return [];
}

function selectedTextNodes() {
  const unique = new Map<string, TextNode>();
  for (const selected of figma.currentPage.selection) {
    for (const text of textNodesFor(selected)) unique.set(text.id, text);
  }
  return [...unique.values()];
}

function selectionName() {
  const names = figma.currentPage.selection.map((node) => node.name);
  if (!names.length) return "Nothing selected";
  return names.length === 1 ? names[0] : `${names.length} selected layers`;
}

function inspectText(node: TextNode, options: ScanOptions): ScanResult {
  const original = node.characters.trim();
  const reasons: string[] = [];
  const fixedTextBox = node.textAutoResize === "NONE" || node.textAutoResize === "HEIGHT";
  const parentClips = "clipsContent" in node.parent! && Boolean(node.parent.clipsContent);
  const shortLabel = original.length > 0 && original.length <= 3;
  const concatenationHint = /(^|\s)[+&/]($|\s)|\{\{|\$\{|%[a-z]/i.test(original);

  if (fixedTextBox && options.expansion >= 15) reasons.push("Fixed text box may clip expanded copy.");
  if (parentClips) reasons.push("Parent frame clips content.");
  if (shortLabel) reasons.push("Very short copy may rely on context or an abbreviation.");
  if (concatenationHint) reasons.push("Review placeholders or concatenated fragments with a translator.");
  if (options.locale === "ar") reasons.push("RTL alignment and reading order need human review.");
  if (original.includes("\n")) reasons.push("Line breaks are hard-coded in the source text.");

  const estimatedWidth = Math.round(node.width * (1 + options.expansion / 100));
  const status = fixedTextBox && options.expansion >= 15 ? "risk" : reasons.length ? "review" : "ready";
  return {
    nodeId: node.id,
    nodeName: node.name,
    original,
    preview: pseudoLocalize(original, options.expansion, options.locale === "ar"),
    characters: original.length,
    estimatedCharacters: Math.ceil(original.length * (1 + options.expansion / 100)),
    width: Math.round(node.width),
    estimatedWidth,
    status,
    reasons
  };
}

function scan(options: ScanOptions): ScanResponse {
  const results = selectedTextNodes().filter((node) => node.characters.trim()).map((node) => inspectText(node, options));
  return { selectionName: selectionName(), textLayers: results.length, results };
}

async function loadFonts(node: TextNode) {
  const fonts = node.getRangeAllFontNames(0, node.characters.length);
  const unique = new Map(fonts.map((font) => [`${font.family}/${font.style}`, font]));
  await Promise.all([...unique.values()].map((font) => figma.loadFontAsync(font)));
}

async function createPreview(options: ScanOptions) {
  const selected = figma.currentPage.selection;
  if (!selected.length) throw new Error("Select a frame, group, component, or text layer first.");
  const rightEdge = Math.max(...selected.map((node) => node.x + node.width));
  const clones = selected.map((node) => node.clone());
  const leftEdge = Math.min(...clones.map((node) => node.x));

  for (const clone of clones) {
    clone.x += rightEdge - leftEdge + 80;
    clone.name = `${clone.name} — ${options.locale.toUpperCase()} preview`;
    clone.setPluginData("i18n-handoff-preview", options.locale);
    for (const text of textNodesFor(clone)) {
      try {
        await loadFonts(text);
        text.characters = pseudoLocalize(text.characters, options.expansion, options.locale === "ar");
        if (options.locale === "ar") text.textAlignHorizontal = "RIGHT";
      } catch {
        text.setPluginData("i18n-handoff-font-error", "true");
      }
    }
  }

  figma.currentPage.selection = clones;
  figma.viewport.scrollAndZoomIntoView(clones);
  return clones.length;
}

function postSelection() {
  figma.ui.postMessage({ type: "selection", name: selectionName(), count: selectedTextNodes().length });
}

figma.on("selectionchange", postSelection);
postSelection();

figma.ui.onmessage = async (message: PluginMessage) => {
  try {
    if (message.type === "scan") figma.ui.postMessage({ type: "scan-result", payload: scan(message.options) });
    if (message.type === "create-preview") {
      const count = await createPreview(message.options);
      figma.ui.postMessage({ type: "preview-created", count });
      postSelection();
    }
  } catch (error) {
    figma.ui.postMessage({ type: "error", message: error instanceof Error ? error.message : "Something went wrong." });
  }
};
