import type { AnnotationFields, FrameCheckSummary, FrameScanSnapshot, PluginToUiMessage, SelectionCheck, SelectionSnapshot, UiToPluginMessage } from "./types";
import { waypointChecklistUrl, waypointRequirementUrls } from "@a11y/content";

const CHECKLIST_KEY = "a11y-before-handoff-checklist";
const ANNOTATION_KEY = "a11y-before-handoff-annotation";
const MAX_FRAMES_TO_SCAN = 80;
const MAX_CHECKS_PER_FRAME = 12;

figma.showUI(__html__, { width: 640, height: 840, themeColors: true });

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

function analyze(node: SceneNode, includeManualReview = true): SelectionCheck[] {
  const checks: SelectionCheck[] = [];
  const genericNames = /^(frame|group|rectangle|component|instance|icon|button|text)(\s|\s?\d|$)/i;
  const hasGenericName = genericNames.test(node.name);

  checks.push({
    id: "layer-name",
    title: hasGenericName ? "Layer name may hide the accessible label" : "Layer name supports handoff context",
    detail: hasGenericName ? `"${node.name}" does not explain the control, destination, or content meaning. Waypoint expects clear labels, headings, and metadata before review.` : `"${node.name}" gives collaborators useful context for labels, headings, or metadata.`,
    status: hasGenericName ? "review" : "pass",
    recommendation: hasGenericName ? "Rename the layer or add an annotation with the accessible name, role, state, and expected behavior." : "Keep the implementation label aligned with this visible intent.",
    waypoint: { section: "Simplified Design Checklist > Text & Copy", requirement: "Button labels clearly describe the action; link text is meaningful.", url: waypointRequirementUrls.clearHeadingsLabels },
    wcag: ["2.4.6", "4.1.2"],
    disabilities: ["Screen reader", "Cognitive", "Physical"]
  });

  if ("opacity" in node) {
    const lowOpacity = node.opacity < 1;
    checks.push({
      id: "opacity",
      title: lowOpacity ? "Opacity may reduce contrast" : "Contrast still needs background review",
      detail: lowOpacity ? `Layer opacity is ${Math.round(node.opacity * 100)}%. Waypoint requires text/background contrast and visible UI states after all effects are applied.` : "No layer opacity is applied, but Figma selection data alone cannot confirm contrast against every background and state.",
      status: lowOpacity ? "review" : "info",
      recommendation: lowOpacity ? "Check the final composited colors and raise contrast if text is below 4.5:1, large text below 3:1, or UI boundaries below 3:1." : "Run a contrast check for the final foreground/background pairing, including dark mode and selected/focus states.",
      waypoint: { section: "Simplified Design Checklist > Color", requirement: "Foreground text and backgrounds meet contrast minimums.", url: waypointRequirementUrls.colorContrast },
      wcag: ["1.4.3", "1.4.11"],
      disabilities: ["Low vision", "Color blindness"]
    });
  }

  if (node.type === "TEXT") {
    const sizes = typeof node.fontSize === "number" ? [node.fontSize] : node.getRangeAllFontNames(0, node.characters.length).map((_, index) => {
      const size = node.getRangeFontSize(index, index + 1);
      return typeof size === "number" ? size : 0;
    });
    const minimum = sizes.length ? Math.min(...sizes) : 0;
    const smallText = minimum > 0 && minimum < 16;
    checks.push({
      id: "text-size",
      title: smallText ? "Text may be hard to read or scale" : "Text size is a reasonable starting point",
      detail: `Smallest detected size: ${minimum || "unknown"} px. Waypoint asks teams to support large text, bold text, high contrast, and 200% scaling without breaking UI.`,
      status: smallText ? "review" : "pass",
      recommendation: smallText ? "Confirm this text remains readable, does not clip when enlarged, and has enough line height in Japanese and English." : "Still test larger text, bold text, long translations, and high contrast together.",
      waypoint: { section: "Simplified Design Checklist > Page Structure", requirement: "Page layout works with large text and text/icons can expand to 200%.", url: waypointRequirementUrls.scalingLegibility },
      wcag: ["1.4.4", "1.4.10"],
      disabilities: ["Low vision", "Cognitive"]
    });
  }

  if ("width" in node && "height" in node) {
    const small = node.width < 24 || node.height < 24;
    const comfortable = node.width >= 44 && node.height >= 44;
    checks.push({
      id: "target-size",
      title: small ? "Interactive target may be too small" : comfortable ? "Dimensions support a comfortable target" : "Target size needs context",
      detail: `${Math.round(node.width)} x ${Math.round(node.height)} px. Waypoint requires object size and spacing that do not demand fine motor precision.`,
      status: small ? "review" : comfortable ? "pass" : "info",
      recommendation: small ? "If this is interactive, increase the hit area or spacing. Use at least 24 x 24 as a floor and prefer 44 x 44 where possible." : "If this is interactive, confirm spacing, hit area, and gesture alternatives in the annotation.",
      waypoint: { section: "Compliance Checklist > Low Vision & Color Blindness / Physical", requirement: "2.4 Object Size & Spacing and 4.1 Large & Simple Controls.", url: waypointRequirementUrls.objectSizeSpacing },
      wcag: ["2.5.8", "2.5.5"],
      disabilities: ["Physical", "Low vision"]
    });
  }

  if (includeManualReview) {
    checks.push({
      id: "human-review",
      title: "Manual review is required for meaning",
      detail: "Waypoint says designers must address the checklist before formal accessibility review. Figma can expose size and names, but it cannot prove meaning, reading order, focus behavior, or assistive technology output.",
      status: "info",
      recommendation: "Use the Checklist and Annotate tabs to record labels, roles, states, focus order, alternatives, and any open questions for engineering/QE.",
      waypoint: { section: "Accessibility Checklist", requirement: "Use the Simplified Design Checklist before formal accessibility review.", url: waypointChecklistUrl },
      wcag: ["1.3.2", "2.4.3", "4.1.2"],
      disabilities: ["Screen reader", "Physical", "Cognitive", "Low vision"]
    });
  }

  return checks;
}

function hasChildren(node: BaseNode): node is BaseNode & ChildrenMixin {
  return "children" in node;
}

function isPluginAnnotationFrame(node: BaseNode) {
  return node.name.indexOf("A11y annotation") === 0;
}

function collectFrames(parent: BaseNode & ChildrenMixin, frames: SceneNode[]) {
  for (const child of parent.children) {
    if (child.type === "FRAME" && !isPluginAnnotationFrame(child)) frames.push(child);
    if (hasChildren(child) && !isPluginAnnotationFrame(child)) collectFrames(child, frames);
  }
}

function shouldScanDescendant(node: SceneNode) {
  return node.type === "TEXT" || node.type === "COMPONENT" || node.type === "INSTANCE";
}

function summarizeChildCheck(node: SceneNode, check: SelectionCheck): SelectionCheck {
  return {
    id: `${node.id}-${check.id}`,
    title: `${node.name}: ${check.title}`,
    detail: `${node.type} - ${check.detail}`,
    status: check.status,
    recommendation: check.recommendation,
    waypoint: check.waypoint,
    wcag: check.wcag,
    disabilities: check.disabilities
  };
}

function scanDescendants(parent: BaseNode & ChildrenMixin, checks: SelectionCheck[]) {
  let layerCount = 0;
  const visit = (node: SceneNode) => {
    layerCount += 1;
    if (shouldScanDescendant(node)) {
      const nodeChecks = analyze(node, false);
      for (const check of nodeChecks) {
        if (check.status === "review" && checks.length < MAX_CHECKS_PER_FRAME) {
          checks.push(summarizeChildCheck(node, check));
        }
      }
    }
    if (hasChildren(node) && !isPluginAnnotationFrame(node)) {
      for (const child of node.children) visit(child);
    }
  };

  for (const child of parent.children) visit(child);
  return layerCount;
}

function summarizeFrame(frame: SceneNode): FrameCheckSummary {
  const checks = analyze(frame, true);
  const layerCount = hasChildren(frame) ? scanDescendants(frame, checks) : 0;
  const passCount = checks.filter((check) => check.status === "pass").length;
  const reviewCount = checks.filter((check) => check.status === "review").length;
  const manualCount = checks.filter((check) => check.status === "info").length;
  return {
    nodeId: frame.id,
    name: frame.name,
    type: frame.type,
    width: "width" in frame ? Math.round(frame.width) : null,
    height: "height" in frame ? Math.round(frame.height) : null,
    layerCount,
    passCount,
    reviewCount,
    manualCount,
    checks
  };
}

function scanAllFrames(): FrameScanSnapshot {
  const frames: SceneNode[] = [];
  collectFrames(figma.currentPage, frames);
  const limitedFrames = frames.slice(0, MAX_FRAMES_TO_SCAN);
  const summaries = limitedFrames.map((frame) => summarizeFrame(frame));
  const checkedLayerCount = summaries.reduce((total, frame) => total + frame.layerCount + 1, 0);
  return {
    pageName: figma.currentPage.name,
    frameCount: frames.length,
    checkedLayerCount,
    truncated: frames.length > MAX_FRAMES_TO_SCAN,
    frames: summaries
  };
}

function findNodeById(parent: BaseNode & ChildrenMixin, nodeId: string): SceneNode | null {
  for (const child of parent.children) {
    if (child.id === nodeId) return child;
    if (hasChildren(child)) {
      const found = findNodeById(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

function isAllowedExternalUrl(url: string) {
  const match = /^https:\/\/([^/?#]+)(?:[/?#]|$)/i.exec(url);
  if (!match) return false;
  const hostname = match[1].split(":")[0].toLowerCase();
  return hostname === "waypoint.sie.sony.com" ||
    hostname === "guide.apps.astronomy.sie.sony.com" ||
    hostname === "www.w3.org" ||
    hostname === "eur-lex.europa.eu" ||
    hostname === "accessible-eu-centre.ec.europa.eu";
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
  frame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.02, g: 0.02, b: 0.02 } }];
  frame.strokeWeight = 1;

  const title = figma.createText();
  title.fontName = { family: "Inter", style: "Bold" };
  title.fontSize = 14;
  title.fills = [{ type: "SOLID", color: { r: 0.02, g: 0.02, b: 0.02 } }];
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
    text.fills = [{ type: "SOLID", color: { r: 0.02, g: 0.02, b: 0.02 } }];
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
  if (message.type === "open-link") {
    if (isAllowedExternalUrl(message.url)) {
      figma.openExternal(message.url);
    } else {
      post({ type: "notice", tone: "warning", message: "This external link is not allowed." });
    }
    return;
  }
  if (message.type === "scan") {
    sendSelection();
    return;
  }
  if (message.type === "scan-all-frames") {
    post({ type: "frame-scan", payload: scanAllFrames() });
    return;
  }
  if (message.type === "select-node") {
    const target = findNodeById(figma.currentPage, message.nodeId);
    if (target) {
      figma.currentPage.selection = [target];
      figma.viewport.scrollAndZoomIntoView([target]);
      sendSelection();
    } else {
      post({ type: "notice", tone: "warning", message: "That frame is not on the current page anymore." });
    }
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
