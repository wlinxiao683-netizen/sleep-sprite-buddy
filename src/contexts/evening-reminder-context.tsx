import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clearTodayEveningPopupShownFlag,
  EVENING_REMINDER_ENABLED_KEY,
  EVENING_REMINDER_TIME_KEY,
} from "@/lib/evening-reminder-storage";

function normalizeTimeInput(t: string): string {
  if (!/^\d{1,2}:\d{1,2}$/.test(t)) return t;
  const [h, m] = t.split(":");
  const hh = Math.min(23, Math.max(0, Number(h)));
  const mm = Math.min(59, Math.max(0, Number(m)));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

type EveningReminderContextValue = {
  eveningReminderEnabled: boolean;
  setEveningReminderEnabled: (v: boolean) => void;
  eveningReminderTime: string;
  setEveningReminderTime: (t: string) => void;
  /** Increments when user changes reminder settings — triggers an immediate preview popup */
  eveningReminderImmediateSignal: number;
};

const EveningReminderContext = createContext<EveningReminderContextValue | null>(null);

function loadTime(): string {
  try {
    const v = localStorage.getItem(EVENING_REMINDER_TIME_KEY);
    if (v && /^\d{1,2}:\d{1,2}$/.test(v)) {
      const [h, m] = v.split(":");
      return `${String(Number(h)).padStart(2, "0")}:${String(Number(m)).padStart(2, "0")}`;
    }
  } catch {
    /* ignore */
  }
  return "20:00";
}

function loadEnabled(): boolean {
  try {
    const v = localStorage.getItem(EVENING_REMINDER_ENABLED_KEY);
    if (v === null) return true;
    return v === "1" || v === "true";
  } catch {
    return true;
  }
}

const TIME_CHANGE_PREVIEW_MS = 450;

export function EveningReminderProvider({ children }: { children: ReactNode }) {
  const [eveningReminderEnabled, setEveningReminderEnabledState] = useState(loadEnabled);
  const [eveningReminderTime, setEveningReminderTimeState] = useState(loadTime);
  const [eveningReminderImmediateSignal, setEveningReminderImmediateSignal] = useState(0);
  const timePreviewTimerRef = useRef<number | null>(null);

  const bumpImmediatePreview = useCallback(() => {
    clearTodayEveningPopupShownFlag();
    setEveningReminderImmediateSignal((n) => n + 1);
  }, []);

  useEffect(() => {
    return () => {
      if (timePreviewTimerRef.current) window.clearTimeout(timePreviewTimerRef.current);
    };
  }, []);

  const setEveningReminderEnabled = useCallback(
    (v: boolean) => {
      setEveningReminderEnabledState(v);
      try {
        localStorage.setItem(EVENING_REMINDER_ENABLED_KEY, v ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (v) {
        bumpImmediatePreview();
      }
    },
    [bumpImmediatePreview]
  );

  const setEveningReminderTime = useCallback(
    (t: string) => {
      const normalized = normalizeTimeInput(t);
      setEveningReminderTimeState(normalized);
      try {
        localStorage.setItem(EVENING_REMINDER_TIME_KEY, normalized);
      } catch {
        /* ignore */
      }
      if (eveningReminderEnabled) {
        if (timePreviewTimerRef.current) window.clearTimeout(timePreviewTimerRef.current);
        timePreviewTimerRef.current = window.setTimeout(() => {
          timePreviewTimerRef.current = null;
          bumpImmediatePreview();
        }, TIME_CHANGE_PREVIEW_MS);
      }
    },
    [bumpImmediatePreview, eveningReminderEnabled]
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === EVENING_REMINDER_TIME_KEY && e.newValue && /^\d{1,2}:\d{1,2}$/.test(e.newValue)) {
        const [h, m] = e.newValue.split(":");
        setEveningReminderTimeState(
          `${String(Number(h)).padStart(2, "0")}:${String(Number(m)).padStart(2, "0")}`
        );
      }
      if (e.key === EVENING_REMINDER_ENABLED_KEY && e.newValue !== null) {
        setEveningReminderEnabledState(e.newValue === "1" || e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      eveningReminderEnabled,
      setEveningReminderEnabled,
      eveningReminderTime,
      setEveningReminderTime,
      eveningReminderImmediateSignal,
    }),
    [
      eveningReminderEnabled,
      setEveningReminderEnabled,
      eveningReminderTime,
      setEveningReminderTime,
      eveningReminderImmediateSignal,
    ]
  );

  return (
    <EveningReminderContext.Provider value={value}>{children}</EveningReminderContext.Provider>
  );
}

export function useEveningReminderSettings() {
  const ctx = useContext(EveningReminderContext);
  if (!ctx) {
    throw new Error("useEveningReminderSettings must be used within EveningReminderProvider");
  }
  return ctx;
}
