export type TargetLocale = "de" | "fi" | "fr" | "es" | "ja" | "ko" | "ar" | "pseudo";
export type RiskStatus = "risk" | "review" | "ready";

export interface ScanOptions {
  locale: TargetLocale;
  expansion: number;
}

export interface ScanResult {
  nodeId: string;
  nodeName: string;
  original: string;
  preview: string;
  characters: number;
  estimatedCharacters: number;
  width: number;
  estimatedWidth: number;
  status: RiskStatus;
  reasons: string[];
}

export interface ScanResponse {
  selectionName: string;
  textLayers: number;
  results: ScanResult[];
}

export type PluginMessage =
  | { type: "scan"; options: ScanOptions }
  | { type: "create-preview"; options: ScanOptions };
