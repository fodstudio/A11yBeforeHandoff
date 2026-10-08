export type CheckStatus = "pass" | "review" | "info";

export interface SelectionCheck {
  id: string;
  title: string;
  detail: string;
  status: CheckStatus;
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

export interface AnnotationFields {
  role: string;
  name: string;
  state: string;
  behavior: string;
}

export type UiToPluginMessage =
  | { type: "scan" }
  | { type: "save-checklist"; ids: string[] }
  | { type: "save-annotation"; annotation: AnnotationFields }
  | { type: "create-annotation"; annotation: AnnotationFields };

export type PluginToUiMessage =
  | { type: "selection"; payload: SelectionSnapshot }
  | { type: "notice"; message: string; tone: "success" | "warning" };

