import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Value = {
  standReminderPreviewSignal: number;
  requestStandReminderPreview: () => void;
};

const StandReminderPreviewContext = createContext<Value | null>(null);

export function StandReminderPreviewProvider({ children }: { children: ReactNode }) {
  const [standReminderPreviewSignal, setStandReminderPreviewSignal] = useState(0);

  const requestStandReminderPreview = useCallback(() => {
    setStandReminderPreviewSignal((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ standReminderPreviewSignal, requestStandReminderPreview }),
    [standReminderPreviewSignal, requestStandReminderPreview]
  );

  return (
    <StandReminderPreviewContext.Provider value={value}>
      {children}
    </StandReminderPreviewContext.Provider>
  );
}

export function useStandReminderPreview() {
  const ctx = useContext(StandReminderPreviewContext);
  if (!ctx) {
    throw new Error("useStandReminderPreview must be used within StandReminderPreviewProvider");
  }
  return ctx;
}
