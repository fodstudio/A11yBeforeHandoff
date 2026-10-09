export type CategoryId =
  | "color"
  | "content"
  | "structure"
  | "interaction"
  | "focus"
  | "motion";

export type Effort = "quick" | "thoughtful";

export interface ChecklistItem {
  id: string;
  category: CategoryId;
  title: string;
  prompt: string;
  why: string;
  how: string;
  wcag: string[];
  effort: Effort;
  tags: string[];
}

export type WcagLevel = "A" | "AA" | "AAA";

export const wcagCriteria: Record<string, { slug: string; level: WcagLevel }> = {
  "1.1.1": { slug: "non-text-content", level: "A" },
  "1.2.1": { slug: "audio-only-and-video-only-prerecorded", level: "A" },
  "1.2.2": { slug: "captions-prerecorded", level: "A" },
  "1.2.3": { slug: "audio-description-or-media-alternative-prerecorded", level: "A" },
  "1.2.5": { slug: "audio-description-prerecorded", level: "AA" },
  "1.3.1": { slug: "info-and-relationships", level: "A" },
  "1.3.2": { slug: "meaningful-sequence", level: "A" },
  "1.4.1": { slug: "use-of-color", level: "A" },
  "1.4.3": { slug: "contrast-minimum", level: "AA" },
  "1.4.4": { slug: "resize-text", level: "AA" },
  "1.4.6": { slug: "contrast-enhanced", level: "AAA" },
  "1.4.10": { slug: "reflow", level: "AA" },
  "1.4.11": { slug: "non-text-contrast", level: "AA" },
  "2.1.1": { slug: "keyboard", level: "A" },
  "2.2.1": { slug: "timing-adjustable", level: "A" },
  "2.2.2": { slug: "pause-stop-hide", level: "A" },
  "2.3.3": { slug: "animation-from-interactions", level: "AAA" },
  "2.4.1": { slug: "bypass-blocks", level: "A" },
  "2.4.2": { slug: "page-titled", level: "A" },
  "2.4.3": { slug: "focus-order", level: "A" },
  "2.4.4": { slug: "link-purpose-in-context", level: "A" },
  "2.4.6": { slug: "headings-and-labels", level: "AA" },
  "2.4.7": { slug: "focus-visible", level: "AA" },
  "2.4.11": { slug: "focus-not-obscured-minimum", level: "AA" },
  "2.4.13": { slug: "focus-appearance", level: "AAA" },
  "2.5.1": { slug: "pointer-gestures", level: "A" },
  "2.5.4": { slug: "motion-actuation", level: "A" },
  "2.5.5": { slug: "target-size-enhanced", level: "AAA" },
  "2.5.7": { slug: "dragging-movements", level: "AA" },
  "2.5.8": { slug: "target-size-minimum", level: "AA" },
  "3.1.1": { slug: "language-of-page", level: "A" },
  "3.1.2": { slug: "language-of-parts", level: "AA" },
  "3.1.5": { slug: "reading-level", level: "AAA" },
  "3.3.1": { slug: "error-identification", level: "A" },
  "3.3.2": { slug: "labels-or-instructions", level: "A" },
  "3.3.3": { slug: "error-suggestion", level: "AA" },
  "3.3.5": { slug: "help", level: "AAA" },
  "4.1.1": { slug: "parsing", level: "A" },
  "4.1.2": { slug: "name-role-value", level: "A" },
  "4.1.3": { slug: "status-messages", level: "AA" }
};

export const wcagUnderstandingUrl = (criterion: string) => {
  const reference = wcagCriteria[criterion];
  return reference ? `https://www.w3.org/WAI/WCAG22/Understanding/${reference.slug}.html` : "https://www.w3.org/TR/WCAG22/";
};

export const eaaRegulationUrl = "https://eur-lex.europa.eu/eli/dir/2019/882/oj/eng";
export const en301549ContextUrl = "https://accessible-eu-centre.ec.europa.eu/content-corner/digital-library/en-3015492021-accessibility-requirements-ict-products-and-services_en";

export interface ComponentGuide {
  slug: string;
  name: string;
  summary: string;
  icon: string;
  intro: string;
  checklistIds: string[];
  questions: string[];
  annotation: {
    role: string;
    name: string;
    state: string;
    behavior: string;
  };
}

export const categories: Array<{
  id: CategoryId;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  { id: "color", label: "Color & contrast", shortLabel: "Color", description: "Keep information visible in different visual conditions." },
  { id: "content", label: "Content & text", shortLabel: "Content", description: "Make labels, instructions, and errors easy to understand." },
  { id: "structure", label: "Structure & semantics", shortLabel: "Structure", description: "Give interfaces a meaningful name, role, and hierarchy." },
  { id: "interaction", label: "Interaction & states", shortLabel: "Interaction", description: "Design complete journeys, not only the default state." },
  { id: "focus", label: "Keyboard & focus", shortLabel: "Focus", description: "Make every action reachable and location obvious." },
  { id: "motion", label: "Motion & media", shortLabel: "Motion", description: "Offer control over movement, timing, sound, and video." }
];

export const checklist: ChecklistItem[] = [
  {
    id: "contrast-text",
    category: "color",
    title: "Text has sufficient contrast",
    prompt: "Does every text style remain readable against its intended background?",
    why: "Low contrast can hide content from people with low vision, color-vision differences, glare, or a dim display.",
    how: "Check every state, theme, gradient, and image background. Treat 4.5:1 for normal text and 3:1 for large text as the baseline.",
    wcag: ["1.4.3", "1.4.6"],
    effort: "quick",
    tags: ["text", "visual", "theme"]
  },
  {
    id: "contrast-ui",
    category: "color",
    title: "Controls and focus indicators are visible",
    prompt: "Can people perceive control boundaries, selected states, and focus without relying on subtle color changes?",
    why: "A control can have readable text while its boundary or current state remains invisible.",
    how: "Check icons, input borders, toggles, charts, selected states, and focus indicators at a 3:1 baseline against adjacent colors.",
    wcag: ["1.4.11"],
    effort: "quick",
    tags: ["controls", "focus", "visual"]
  },
  {
    id: "not-color-only",
    category: "color",
    title: "Meaning is not conveyed by color alone",
    prompt: "If color disappeared, would status, error, and selection still be understandable?",
    why: "Color may be unavailable or interpreted differently, and color-only cues are easy to miss.",
    how: "Pair color with text, an icon plus accessible label, a pattern, or a clearly defined shape.",
    wcag: ["1.4.1"],
    effort: "quick",
    tags: ["status", "error", "charts"]
  },
  {
    id: "text-resize",
    category: "content",
    title: "Layouts survive larger text",
    prompt: "Can text grow without clipping, overlap, or loss of actions and information?",
    why: "Many people enlarge text or use system font settings to read comfortably.",
    how: "Avoid fixed-height text containers. Explore long translations and at least 200% text size before handoff.",
    wcag: ["1.4.4", "1.4.10"],
    effort: "thoughtful",
    tags: ["responsive", "i18n", "text"]
  },
  {
    id: "plain-labels",
    category: "content",
    title: "Labels describe the action or destination",
    prompt: "Would a label make sense when read without the surrounding screen?",
    why: "Clear labels reduce cognitive load and help screen-reader users navigate lists of controls and links.",
    how: "Prefer specific verbs and destinations. Replace repeated labels such as “Learn more” when they lead to different places.",
    wcag: ["2.4.4", "2.4.6"],
    effort: "quick",
    tags: ["labels", "links", "screen reader"]
  },
  {
    id: "errors-help",
    category: "content",
    title: "Errors explain what happened and how to recover",
    prompt: "Does each error identify the problem and offer a useful next step?",
    why: "Generic errors force people to guess, repeat work, or abandon a task.",
    how: "Place the message near the source, summarize at the top when useful, preserve entered data, and announce the update.",
    wcag: ["3.3.1", "3.3.3"],
    effort: "thoughtful",
    tags: ["error", "forms", "content"]
  },
  {
    id: "language-length",
    category: "content",
    title: "Content works across languages",
    prompt: "Have long translations, different scripts, and right-to-left layouts been considered?",
    why: "Clipped text and mirrored meaning can turn an otherwise accessible design into an unusable one.",
    how: "Use flexible containers, avoid text baked into images, annotate directional icons, and test representative long strings.",
    wcag: ["1.4.10", "3.1.2"],
    effort: "thoughtful",
    tags: ["i18n", "rtl", "responsive"]
  },
  {
    id: "heading-order",
    category: "structure",
    title: "Heading levels form a useful outline",
    prompt: "Do headings describe the page structure without skipping levels for visual styling?",
    why: "Headings let screen-reader users skim and understand the relationship between sections.",
    how: "Annotate semantic levels separately from visual size. Keep one clear page title and a logical nested outline.",
    wcag: ["1.3.1", "2.4.6"],
    effort: "quick",
    tags: ["headings", "screen reader", "hierarchy"]
  },
  {
    id: "name-role-state",
    category: "structure",
    title: "Every control has a name, role, and state",
    prompt: "Can assistive technology identify what the control is, what it is called, and its current value?",
    why: "Visual appearance alone does not expose meaning to a screen reader or voice-control system.",
    how: "Annotate the accessible name, expected native element or role, value, and states such as expanded, pressed, or invalid.",
    wcag: ["4.1.2"],
    effort: "thoughtful",
    tags: ["annotation", "screen reader", "controls"]
  },
  {
    id: "reading-order",
    category: "structure",
    title: "Reading order matches the intended meaning",
    prompt: "If content were read linearly, would the order still make sense?",
    why: "Visual placement can differ from DOM or screen-reader order, especially in cards, grids, and overlays.",
    how: "Document the intended order for complex layouts and avoid using position alone to express relationships.",
    wcag: ["1.3.2"],
    effort: "thoughtful",
    tags: ["screen reader", "layout", "annotation"]
  },
  {
    id: "all-states",
    category: "interaction",
    title: "All meaningful states are designed",
    prompt: "Are hover, focus, pressed, selected, disabled, loading, empty, success, and error states covered?",
    why: "Missing states create ambiguity and leave implementation decisions too late in the process.",
    how: "Only include states the component needs, but specify how each changes visually and what assistive technology should announce.",
    wcag: ["4.1.2", "4.1.3"],
    effort: "quick",
    tags: ["states", "components", "handoff"]
  },
  {
    id: "target-size",
    category: "interaction",
    title: "Targets are comfortably sized and spaced",
    prompt: "Can actions be selected without fine motor precision or accidental activation?",
    why: "Small or crowded targets are difficult with touch, tremor, limited dexterity, or motion.",
    how: "Aim for at least 24×24 CSS pixels and use a larger 44×44 target where the context allows it.",
    wcag: ["2.5.5", "2.5.8"],
    effort: "quick",
    tags: ["touch", "controls", "motor"]
  },
  {
    id: "alternatives-gestures",
    category: "interaction",
    title: "Complex gestures have simple alternatives",
    prompt: "Can drag, swipe, pinch, and path-based gestures be completed with a simple action?",
    why: "Complex gestures may be impossible with limited mobility, keyboard input, or switch control.",
    how: "Provide buttons, menus, or single-pointer alternatives and avoid making device motion the only input.",
    wcag: ["2.5.1", "2.5.4", "2.5.7"],
    effort: "thoughtful",
    tags: ["gesture", "drag", "mobile"]
  },
  {
    id: "focus-visible",
    category: "focus",
    title: "Keyboard focus is always visible",
    prompt: "Can people see which interactive element currently has focus?",
    why: "Keyboard and switch users navigate without a pointer and need a persistent location cue.",
    how: "Design focus for every interactive component, with strong contrast, enough area, and no clipping by containers.",
    wcag: ["2.4.7", "2.4.11", "2.4.13"],
    effort: "quick",
    tags: ["keyboard", "focus", "components"]
  },
  {
    id: "focus-order",
    category: "focus",
    title: "Focus order follows the task",
    prompt: "Does keyboard navigation move in a predictable sequence that preserves meaning?",
    why: "Unexpected jumps make interfaces confusing and can separate controls from their labels or context.",
    how: "Annotate order for non-linear layouts. Keep it aligned with reading order and avoid positive tabindex values.",
    wcag: ["2.4.3"],
    effort: "thoughtful",
    tags: ["keyboard", "focus", "annotation"]
  },
  {
    id: "overlay-focus",
    category: "focus",
    title: "Overlays define focus entry, containment, and return",
    prompt: "When a dialog or menu opens, is the next focus position and eventual return point clear?",
    why: "Focus left behind an overlay can make keyboard and screen-reader navigation appear broken.",
    how: "Specify initial focus, whether focus is contained, Escape behavior, and the element that receives focus after closing.",
    wcag: ["2.4.3"],
    effort: "thoughtful",
    tags: ["dialog", "menu", "focus"]
  },
  {
    id: "reduce-motion",
    category: "motion",
    title: "Non-essential motion can be reduced",
    prompt: "Does the experience respect reduced-motion preferences and avoid unnecessary movement?",
    why: "Animation can trigger dizziness, nausea, distraction, or loss of concentration.",
    how: "Define a reduced-motion behavior, avoid parallax and large movement by default, and keep essential feedback subtle.",
    wcag: ["2.3.3"],
    effort: "thoughtful",
    tags: ["animation", "preference", "vestibular"]
  },
  {
    id: "pause-motion",
    category: "motion",
    title: "Moving or updating content can be paused",
    prompt: "Can people stop carousels, auto-updates, animation, and time limits when they need to?",
    why: "Changing content can interrupt reading and create barriers for attention, cognition, and motor access.",
    how: "Avoid autoplay when possible. Provide visible pause controls and do not hide critical content behind a short timeout.",
    wcag: ["2.2.1", "2.2.2"],
    effort: "thoughtful",
    tags: ["carousel", "timing", "animation"]
  },
  {
    id: "media-alternatives",
    category: "motion",
    title: "Media includes equivalent alternatives",
    prompt: "Are captions, transcripts, audio description, and accessible controls planned where relevant?",
    why: "Audio and visual content must remain available when a person cannot hear, see, or operate the default player.",
    how: "Include alternatives in the content plan and reserve layout space for captions and player controls.",
    wcag: ["1.2.1", "1.2.2", "1.2.3", "1.2.5"],
    effort: "thoughtful",
    tags: ["video", "audio", "captions"]
  }
];

export const componentGuides: ComponentGuide[] = [
  {
    slug: "button",
    name: "Button",
    summary: "An action with a clear name, visible states, and a forgiving target.",
    icon: "↗",
    intro: "Buttons initiate an action. Their label should describe the result, and every interaction mode should receive equivalent feedback.",
    checklistIds: ["contrast-ui", "plain-labels", "name-role-state", "all-states", "target-size", "focus-visible"],
    questions: ["Is this truly an action rather than navigation?", "Does an icon-only button have an accessible name?", "What happens while the action is processing?"],
    annotation: { role: "Button", name: "Use the visible action label", state: "Default / hover / focus / pressed / disabled / loading", behavior: "Activates on click, Enter, or Space; announce completion when needed" }
  },
  {
    slug: "dialog",
    name: "Dialog",
    summary: "A focused task with a clear title, deliberate entry, and reliable exit.",
    icon: "□",
    intro: "Dialogs interrupt the current context. Use them sparingly and document how focus moves in, stays available, and returns.",
    checklistIds: ["contrast-ui", "plain-labels", "heading-order", "name-role-state", "focus-order", "overlay-focus"],
    questions: ["Does the dialog need to block the page?", "Which element receives initial focus?", "Where does focus return after close?"],
    annotation: { role: "Dialog; modal when background is unavailable", name: "Reference the visible dialog title", state: "Open; busy or error when applicable", behavior: "Move focus inside, contain it for modal dialogs, close with explicit action and Escape" }
  },
  {
    slug: "form-field",
    name: "Form field",
    summary: "A persistent label, understandable requirement, and recoverable error.",
    icon: "⌁",
    intro: "Fields need a programmatic label and instructions that remain available before, during, and after entry.",
    checklistIds: ["contrast-text", "not-color-only", "plain-labels", "errors-help", "name-role-state", "focus-visible"],
    questions: ["Is the visible label persistent?", "Are required format and constraints known before entry?", "How is an error associated and announced?"],
    annotation: { role: "Use the native input type", name: "Reference the persistent visible label", state: "Required / invalid / disabled / read-only as applicable", behavior: "Keep instructions associated; announce errors and preserve the entered value" }
  },
  {
    slug: "navigation",
    name: "Navigation",
    summary: "A predictable route through pages with meaningful link names.",
    icon: "→",
    intro: "Navigation should help people understand both where they are and where each option will take them.",
    checklistIds: ["contrast-ui", "plain-labels", "heading-order", "name-role-state", "focus-visible", "focus-order"],
    questions: ["Is the current location exposed beyond color?", "Do duplicate navigation regions have distinct names?", "Can repeated navigation be skipped?"],
    annotation: { role: "Navigation landmark containing links", name: "Name repeated regions, such as Primary or Account", state: "Expose current page when applicable", behavior: "Links activate on Enter and follow a predictable focus order" }
  },
  {
    slug: "card",
    name: "Card",
    summary: "A grouped summary with an intentional reading and interaction model.",
    icon: "▤",
    intro: "Cards are visual groupings, not a native control. Decide whether the card contains links and buttons or acts as one clear target.",
    checklistIds: ["contrast-text", "plain-labels", "reading-order", "name-role-state", "target-size", "focus-visible"],
    questions: ["Is the entire card interactive or only a clear link?", "What is the intended reading order?", "Will nested actions create conflicting targets?"],
    annotation: { role: "Usually a group or article; do not invent a card role", name: "Use the heading when the group needs a name", state: "Selected only when selection is meaningful", behavior: "Avoid nested interactive targets inside an all-clickable card" }
  },
  {
    slug: "toast",
    name: "Toast",
    summary: "A timely update that is announced without stealing focus.",
    icon: "◌",
    intro: "Toasts are easy to miss. Use them for supplementary feedback, keep them available long enough, and announce meaningful updates.",
    checklistIds: ["contrast-ui", "not-color-only", "plain-labels", "name-role-state", "target-size", "pause-motion"],
    questions: ["Would missing the toast block the task?", "Should the update be polite or urgent?", "Can any action remain available elsewhere?"],
    annotation: { role: "Status for routine updates; alert only for urgent interruption", name: "Use concise visible message content", state: "Success / information / warning / error", behavior: "Announce without moving focus; do not rely on a short timeout for required action" }
  }
];

export const getChecklistItem = (id: string) => checklist.find((item) => item.id === id);
export const getComponentGuide = (slug: string) => componentGuides.find((guide) => guide.slug === slug);

export * from "./locales";
