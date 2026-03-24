import { createContext, useContext, type ReactNode } from "react";
import { useSleepPlan } from "@/hooks/use-sleep-plan";

type SleepPlanContextValue = ReturnType<typeof useSleepPlan>;

const SleepPlanContext = createContext<SleepPlanContextValue | null>(null);

export function SleepPlanProvider({ children }: { children: ReactNode }) {
  const value = useSleepPlan();
  return <SleepPlanContext.Provider value={value}>{children}</SleepPlanContext.Provider>;
}

export function useSleepPlanContext(): SleepPlanContextValue {
  const ctx = useContext(SleepPlanContext);
  if (!ctx) {
    throw new Error("useSleepPlanContext must be used within SleepPlanProvider");
  }
  return ctx;
}
