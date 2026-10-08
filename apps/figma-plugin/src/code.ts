import type { AnnotationFields, PluginToUiMessage, SelectionCheck, SelectionSnapshot, UiToPluginMessage } from "./types";

const CHECKLIST_KEY = "a11y-before-handoff-checklist";
const ANNOTATION_KEY = "a11y-before-handoff-annotation";

figma.showUI(__html__, { width: 392, height: 640, themeColors: true });

function post(message: PluginToUiMessage) {
  figma.ui.postMessage(message);
}

function getSingleSelection(): SceneNode | null {
  return figma.currentPage.selection.length === 1 ? figma.currentPage.selection[0] : null;
}

function parseStringArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : [];
  } catch {
    return [];
  }
}

function parseAnnotation(value: string): AnnotationFields | undefined {
  try {
    const parsed = JSON.parse(value) as Partial<AnnotationFields>;
    if ([parsed.role, parsed.name, parsed.state, parsed.behavior].every((entry) => typeof entry === "string")) return parsed as AnnotationFields;
  } catch {
    // Empty or legacy plugin data is safe to ignore.
  }
  return undefined;
}

function analyze(node: SceneNode): SelectionCheck[] {
  const checks: SelectionCheck[] = [];
  const genericNames = /^(frame|group|rectangle|component|instance|icon|button|text)(\s|\s?\d|$)/i;

  checks.push({
    id: "layer-name",
    title: genericNames.test(node.name) ? "Layer name needs context" : "Layer name is descriptive",
    detail: genericNames.test(node.name) ? `“${node.name}” may not explain this element during handoff.` : `“${node.name}” gives collaborators useful context.`,
    status: genericNames.test(node.name) ? "review" : "pass"
  });

  if ("opacity" in node) {
    const lowOpacity = node.opacity < 1;
    checks.push({
      id: "opacity",
      title: lowOpacity ? "Review visual contrast" : "No layer opacity applied",
      detail: lowOpacity ? `Layer opacity is ${Math.round(node.opacity * 100)}%. Verify the final composited contrast.` : "Contrast still needs a human check against the intended background.",
      status: lowOpacity ? "review" : "info"
    });
  }

  if (node.type === "TEXT") {
    const sizes = typeof node.fontSize === "number" ? [node.fontSize] : node.getRangeAllFontNames(0, node.characters.length).map((_, index) => {
      const size = node.getRangeFontSize(index, index + 1);
      return typeof size === "number" ? size : 0;
    });
    const minimum = sizes.length ? Math.min(...sizes) : 0;
    checks.push({
      id: "text-size",
      title: minimum >= 16 ? "Text size is a comfortable starting point" : "Review small text",
      detail: `Smallest detected size: ${minimum || "unknown"} px. Size alone does not determine readability.`,
      status: minimum >= 16 ? "pass" : "review"
    });
  }

  if ("width" in node && "height" in node) {
    const small = node.width < 24 || node.height < 24;
    checks.push({
      id: "target-size",
      title: small ? "Potentially small target" : "Dimensions support a usable target",
      detail: `${Math.round(node.width)} × ${Math.round(node.height)} px. Apply this only if the selection is interactive.`,
      status: small ? "review" : "info"
    });
  }

  checks.push({
    id: "human-review",
    title: "Human review is still required",
    detail: "Confirm accessible name, role, state, reading order, focus, contrast, and interaction intent.",
    status: "info"
  });

  return checks;
}

function snapshot(): SelectionSnapshot {
  const node = getSingleSelection();
  if (!node) {
    return {
      nodeId: null,
      name: figma.currentPage.selection.length > 1 ? `${figma.currentPage.selection.length} layers selected` : "Nothing selected",
      type: "—",
      width: null,
      height: null,
      checks: [],
      savedChecklistIds: []
    };
  }
  return {
    nodeId: node.id,
    name: node.name,
    type: node.type,
    width: "width" in node ? Math.round(node.width) : null,
    height: "height" in node ? Math.round(node.height) : null,
    checks: analyze(node),
    savedChecklistIds: parseStringArray(node.getPluginData(CHECKLIST_KEY)),
    annotation: parseAnnotation(node.getPluginData(ANNOTATION_KEY))
  };
}

function sendSelection() {
  post({ type: "selection", payload: snapshot() });
}

async function createAnnotation(node: SceneNode, annotation: AnnotationFields) {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  const frame = figma.createFrame();
  frame.name = `A11y annotation — ${node.name}`;
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "FIXED";
  frame.resize(320, 100);
  frame.paddingTop = 20;
  frame.paddingRight = 20;
  frame.paddingBottom = 20;
  frame.paddingLeft = 20;
  frame.itemSpacing = 12;
  frame.cornerRadius = 8;
  frame.fills = [{ type: "SOLID", color: { r: 0.851, g: 0.98, b: 0.286 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.09, g: 0.09, b: 0.08 } }];
  frame.strokeWeight = 1;

  const title = figma.createText();
  title.fontName = { family: "Inter", style: "Bold" };
  title.fontSize = 14;
  title.characters = `Accessibility · ${node.name}`;
  frame.appendChild(title);

  const fields: Array<[string, string]> = [
    ["ROLE", annotation.role],
    ["NAME", annotation.name],
    ["STATE", annotation.state],
    ["BEHAVIOR", annotation.behavior]
  ];
  for (const [label, value] of fields) {
    const text = figma.createText();
    text.fontName = { family: "Inter", style: "Regular" };
    text.fontSize = 12;
    text.lineHeight = { unit: "PIXELS", value: 18 };
    text.characters = `${label}\n${value || "Needs definition"}`;
    text.layoutAlign = "STRETCH";
    frame.appendChild(text);
  }

  const box = node.absoluteBoundingBox;
  if (box) {
    frame.x = box.x + box.width + 40;
    frame.y = box.y;
  }
  frame.setPluginData(ANNOTATION_KEY, JSON.stringify(annotation));
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([node, frame]);
}

figma.ui.onmessage = async (message: UiToPluginMessage) => {
  const node = getSingleSelection();
  if (message.type === "scan") {
    sendSelection();
    return;
  }
  if (!node) {
    post({ type: "notice", tone: "warning", message: "Select exactly one layer first." });
    return;
  }
  if (message.type === "save-checklist") {
    node.setPluginData(CHECKLIST_KEY, JSON.stringify(message.ids));
    post({ type: "notice", tone: "success", message: "Checklist saved to this layer." });
  }
  if (message.type === "save-annotation") {
    node.setPluginData(ANNOTATION_KEY, JSON.stringify(message.annotation));
    post({ type: "notice", tone: "success", message: "Annotation details saved." });
  }
  if (message.type === "create-annotation") {
    node.setPluginData(ANNOTATION_KEY, JSON.stringify(message.annotation));
    await createAnnotation(node, message.annotation);
    post({ type: "notice", tone: "success", message: "Annotation added beside the selection." });
  }
};

figma.on("selectionchange", sendSelection);
sendSelection();
