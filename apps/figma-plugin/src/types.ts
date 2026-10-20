export type CheckStatus = "pass" | "review" | "info";

export interface SelectionCheck {
  id: string;
  title: string;
  detail: string;
  status: CheckStatus;
  recommendation?: string;
  waypoint?: {
    section: string;
    requirement: string;
    url: string;
  };
  wcag?: string[];
  disabilities?: string[];
}

export interface SelectionSnapshot {
  nodeId: string | null;
  name: string;
  type: string;
  width: number | null;
  height: number | null;
  checks: SelectionCheck[];
  savedChecklistIds: string[];
  annotation?: AnnotationFields;
}

export interface FrameCheckSummary {
  nodeId: string;
  name: string;
  type: string;
  width: number | null;
  height: number | null;
  layerCount: number;
  passCount: number;
  reviewCount: number;
  manualCount: number;
  checks: SelectionCheck[];
}

export interface FrameScanSnapshot {
  pageName: string;
  frameCount: number;
  checkedLayerCount: number;
  truncated: boolean;
  frames: FrameCheckSummary[];
}

export interface AnnotationFields {
  role: string;
  name: string;
  state: string;
  behavior: string;
}

export type UiToPluginMessage =
  | { type: "scan" }
  | { type: "scan-all-frames" }
  | { type: "open-link"; url: string }
  | { type: "select-node"; nodeId: string }
  | { type: "save-checklist"; ids: string[] }
  | { type: "save-annotation"; annotation: AnnotationFields }
  | { type: "create-annotation"; annotation: AnnotationFields };

export type PluginToUiMessage =
  | { type: "selection"; payload: SelectionSnapshot }
  | { type: "frame-scan"; payload: FrameScanSnapshot }
  | { type: "notice"; message: string; tone: "success" | "warning" };
