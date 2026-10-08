import type { CSSProperties } from "react";
import { usePreferences } from "../preferences";

export function ProgressRing({ current, total, size = "large" }: { current: number; total: number; size?: "large" | "small" }) {
  const { t } = usePreferences();
  const percent = total === 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className={`progress-ring progress-${size}`} style={{ "--progress": `${percent * 3.6}deg` } as CSSProperties}>
      <span><strong>{percent}%</strong>{size === "large" && <small>{t("check.reviewed")}</small>}</span>
    </div>
  );
}
