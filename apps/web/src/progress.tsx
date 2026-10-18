import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "a11y-before-handoff:progress:v1";

interface ProgressContextValue {
  checked: Set<string>;
  toggle: (id: string) => void;
  reset: () => void;
  isChecked: (id: string) => boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

function readStoredProgress(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? new Set(JSON.parse(value) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState<Set<string>>(readStoredProgress);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]));
  }, [checked]);

  const toggle = useCallback((id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => setChecked(new Set()), []);
  const value = useMemo(() => ({ checked, toggle, reset, isChecked: (id: string) => checked.has(id) }), [checked, reset, toggle]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside ProgressProvider");
  return value;
}

